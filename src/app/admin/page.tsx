import Link from 'next/link';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { formatIndiaDate, formatIndiaDateTime, whatsappDigits } from '@/lib/format-india';
import { getCoverage, getUnmappedPolls, type CoverageData } from '@/lib/coverage';
import LoginScreen from './components/LoginScreen';
import AdminHeader from './components/AdminHeader';
import AdminAccordion from './components/AdminAccordion';
import ContactMsgs from './components/ContactMsgs';
import Subscribers from './components/Subscribers';
import PollsList from './components/PollsList';
import CoverageAnalytics from './components/CoverageAnalytics';
import UnmappedPolls from './components/UnmappedPolls';
import LocationManager from './components/LocationManager';
import {
  handleLogout,
  editPoll,
  deletePoll,
  addPollOption,
  deleteMessage,
} from './actions/adminActions';
import {
  assignPollLocation,
  addSamitis,
  addGramPanchayats,
  addZilaWards,
  addSamitiWards,
  updateLocationName,
} from './actions/locationActions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const SUBSCRIBER_PREVIEW = 100;

type AdminSearchParams = {
  error?: string;
  page?: string;
  search?: string;
  subs?: string;
  cov?: string;
  map?: string;
  loc?: string;
  msg?: string;
};

type DistrictItem = { id: string; nameHi: string; nameEn: string };

export default async function AdminDashboard(props: {
  searchParams?: Promise<AdminSearchParams>;
}) {
  const params = props.searchParams ? await props.searchParams : {};

  if (!(await isAdmin())) {
    return <LoginScreen error={params.error} />;
  }

  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const searchQuery = (params.search ?? '').trim().slice(0, 100);
  const showAllSubscribers = params.subs === 'all';
  const flashMessage = (params.msg ?? '').slice(0, 250);

  const pollsOpen = Boolean(searchQuery) || currentPage > 1;

  const failed: string[] = [];
  async function safe<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await run();
    } catch (e) {
      console.error(`${label} load truti:`, e);
      failed.push(label);
      return fallback;
    }
  }

  const pollWhere = searchQuery ? { question: { contains: searchQuery } } : {};

  const [polls, totalPolls, messages, subscribers, totalSubscribers, voteSum, districts, coverage] =
    await Promise.all([
      safe(
        'poll',
        () =>
          db.poll.findMany({
            where: pollWhere,
            orderBy: { createdAt: 'desc' },
            include: { options: true },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
          }),
        [] as any[]
      ),
      safe('poll ganana', () => db.poll.count({ where: pollWhere }), 0),
      safe('sampark sandesh', () => db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } }), [] as any[]),
      safe(
        'sadasya सूची',
        () =>
          (db as any).newsletterSubscriber.findMany({
            orderBy: { createdAt: 'desc' },
            ...(showAllSubscribers ? {} : { take: SUBSCRIBER_PREVIEW }),
          }),
        [] as any[]
      ),
      safe('sadasya ganana', () => (db as any).newsletterSubscriber.count(), 0),
      safe('kul mat', () => db.pollOption.aggregate({ _sum: { voteCount: true } }), null as any),
      safe(
        'jile',
        () =>
          db.district.findMany({
            select: { id: true, nameHi: true, nameEn: true },
            orderBy: { nameEn: 'asc' },
          }),
        [] as DistrictItem[]
      ),
      safe('panchayat coverage', () => getCoverage(), null as CoverageData | null),
    ]);

  const unmappedPolls = coverage
    ? await safe(
        'bina panchayat wale poll',
        () => getUnmappedPolls(coverage.unmappedIds),
        [] as Awaited<ReturnType<typeof getUnmappedPolls>>
      )
    : [];

  const totalVotes = voteSum?._sum?.voteCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalPolls / PAGE_SIZE));
  const unmappedCount = coverage?.unmappedIds.length ?? 0;

  return (
    <main className="min-h-screen bg-slate-100 pb-14">
      <AdminHeader
        totalPolls={totalPolls}
        totalVotes={totalVotes}
        totalSubscribers={totalSubscribers}
        totalMessages={messages.length}
        logoutAction={handleLogout}
      />

      <div className="mx-auto mt-8 max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
        {flashMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            ✅ {flashMessage}
          </div>
        )}

        {failed.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            ⚠️ in anubhagon ka data load nahi ho saka: {failed.join(', ')}।
          </div>
        )}

        {/* 1. Panchayat Coverage Analysis */}
        {coverage && (
          <AdminAccordion
            icon="📈"
            title="Panchayat Coverage Analysis"
            subtitle="Kitni panchayaton me poll chal rahe hain"
            count={coverage.totals.gpWithRunning}
            countLabel="Chalu poll wali panchayatein"
            tone="emerald"
            defaultOpen={Boolean(params.cov)}
          >
            <CoverageAnalytics data={coverage} />
          </AdminAccordion>
        )}

        {/* 2. Unmapped Polls */}
        <AdminAccordion
          icon="📍"
          title="Bina Panchayat Wale Poll"
          subtitle="Jile me seedhe bane poll ko unki panchayat se jodein"
          count={unmappedCount}
          countLabel="Jodna baki"
          tone="amber"
          defaultOpen={Boolean(params.map)}
        >
          <UnmappedPolls
            polls={unmappedPolls}
            total={unmappedCount}
            districts={districts}
            assignPollLocation={assignPollLocation}
            formatIndiaDateTime={formatIndiaDateTime}
          />
        </AdminAccordion>

        {/* 3. Location Data Management */}
        <AdminAccordion
          icon="🗺️"
          title="Sthan Data Prabandhan"
          subtitle="Panchayat samitiyan, gram panchayatein, samiti ward aur zila parishad ward bharein"
          count={coverage?.totals.samitis ?? 0}
          countLabel="Kul samitiyan"
          tone="blue"
          defaultOpen={Boolean(params.loc)}
        >
          <LocationManager
            districts={districts}
            addSamitis={addSamitis}
            addGramPanchayats={addGramPanchayats}
            addSamitiWards={addSamitiWards}
            addZilaWards={addZilaWards}
            updateLocationName={updateLocationName}
          />
        </AdminAccordion>

        {/* 4. Contact Messages */}
        <AdminAccordion
          icon="✉️"
          title="Upayogkarta Sampark Sandesh"
          subtitle="Sampark form se prapt sabhi sandesh dekhein"
          count={messages.length}
          countLabel="Kul sandesh"
          tone="blue"
        >
          <ContactMsgs
            messages={messages as any}
            deleteMessage={deleteMessage}
            formatIndiaDateTime={formatIndiaDateTime}
            whatsappDigits={whatsappDigits}
          />
        </AdminAccordion>

        {/* 5. Newsletter Subscribers */}
        <AdminAccordion
          icon="📧"
          title="Newsletter Sadasya Suchi"
          subtitle="Sadasyon ke email dekhein"
          count={totalSubscribers}
          countLabel="Kul sadasya"
          tone="amber"
          defaultOpen={showAllSubscribers}
        >
          <Subscribers
            subscribers={subscribers as any}
            total={totalSubscribers}
            showAll={showAllSubscribers}
            formatIndiaDateTime={formatIndiaDateTime}
          />
        </AdminAccordion>

        {/* 6. Poll Management */}
        <AdminAccordion
          icon="📊"
          title="Poll Prabandhan"
          subtitle="Poll khojein, sampadit karein"
          count={totalPolls}
          countLabel="Kul poll"
          tone="emerald"
          defaultOpen={pollsOpen}
        >
          <form
            action="/admin"
            method="get"
            className="mb-3 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-3 sm:flex-row"
          >
            <input
              type="search"
              name="search"
              defaultValue={searchQuery}
              placeholder="Poll ke prashn se khojein..."
              className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              🔍 Khojein
            </button>
            {searchQuery && (
              <Link
                href="/admin"
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-center text-xs font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Khoj hatayein
              </Link>
            )}
          </form>

          <PollsList
            polls={polls}
            totalPolls={totalPolls}
            searchQuery={searchQuery}
            currentPage={currentPage}
            totalPages={totalPages}
            deletePoll={deletePoll}
            editPoll={editPoll}
            addPollOption={addPollOption}
            formatIndiaDate={formatIndiaDate}
          />
        </AdminAccordion>
      </div>
    </main>
  );
}