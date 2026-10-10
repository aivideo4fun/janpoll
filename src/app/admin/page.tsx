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

  // पेज बदलने या खोज करने पर पोल वाला कार्ड खुला रहे
  const pollsOpen = Boolean(searchQuery) || currentPage > 1;

  // कोई एक क्वेरी फेल हो तो पूरा पेज न टूटे, पर त्रुटि साफ़ दिखे
  const failed: string[] = [];
  async function safe<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await run();
    } catch (e) {
      console.error(`${label} लोड त्रुटि:`, e);
      failed.push(label);
      return fallback;
    }
  }

  const pollWhere = searchQuery ? { question: { contains: searchQuery } } : {};

  const [polls, totalPolls, messages, subscribers, totalSubscribers, voteSum, districts, coverage] =
    await Promise.all([
      safe(
        'पोल',
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
      safe('पोल गणना', () => db.poll.count({ where: pollWhere }), 0),
      safe('संपर्क संदेश', () => db.contactMessage.findMany({ orderBy: { createdAt: 'desc' } }), [] as any[]),
      safe(
        'सदस्य सूची',
        () =>
          (db as any).newsletterSubscriber.findMany({
            orderBy: { createdAt: 'desc' },
            ...(showAllSubscribers ? {} : { take: SUBSCRIBER_PREVIEW }),
          }),
        [] as any[]
      ),
      safe('सदस्य गणना', () => (db as any).newsletterSubscriber.count(), 0),
      safe('कुल मत', () => db.pollOption.aggregate({ _sum: { voteCount: true } }), null as any),
      safe(
        'जिले',
        () =>
          db.district.findMany({
            select: { id: true, nameHi: true, nameEn: true },
            orderBy: { nameEn: 'asc' },
          }),
        [] as DistrictItem[]
      ),
      safe('पंचायत कवरेज', () => getCoverage(), null as CoverageData | null),
    ]);

  const unmappedPolls = coverage
    ? await safe(
        'बिना पंचायत वाले पोल',
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
            ⚠️ इन अनुभागों का डेटा लोड नहीं हो सका: {failed.join(', ')}। कृपया पेज रीफ़्रेश करें या सर्वर लॉग देखें।
          </div>
        )}

        {/* नया 1. पंचायत कवरेज विश्लेषण */}
        {coverage && (
          <AdminAccordion
            icon="📈"
            title="पंचायत कवरेज विश्लेषण"
            subtitle="कितनी पंचायतों में पोल चल रहे हैं और कहाँ अभी तक पोल नहीं बना"
            count={coverage.totals.gpWithRunning}
            countLabel="चालू पोल वाली पंचायतें"
            tone="emerald"
            defaultOpen={Boolean(params.cov)}
          >
            <CoverageAnalytics data={coverage} />
          </AdminAccordion>
        )}

        {/* नया 2. बिना पंचायत वाले पोल (मैपिंग) */}
        <AdminAccordion
          icon="📍"
          title="बिना पंचायत वाले पोल"
          subtitle="जिले में सीधे बने पोल को उनकी पंचायत, समिति और जिले से जोड़ें"
          count={unmappedCount}
          countLabel="जोड़ना बाकी"
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

        {/* नया 3. स्थान डेटा प्रबंधन */}
        <AdminAccordion
          icon="🗺️"
          title="स्थान डेटा प्रबंधन"
          subtitle="पंचायत समितियाँ, ग्राम पंचायतें और जिला परिषद वार्ड भरें"
          count={coverage?.totals.samitis ?? 0}
          countLabel="कुल समितियाँ"
          tone="blue"
          defaultOpen={Boolean(params.loc)}
        >
          <LocationManager
            districts={districts}
            addSamitis={addSamitis}
            addGramPanchayats={addGramPanchayats}
            addZilaWards={addZilaWards}
          />
        </AdminAccordion>

        {/* 1. संपर्क संदेश */}
        <AdminAccordion
          icon="✉️"
          title="उपयोगकर्ता संपर्क संदेश"
          subtitle="संपर्क फॉर्म से प्राप्त सभी संदेश देखें और प्रबंधित करें"
          count={messages.length}
          countLabel="कुल संदेश"
          tone="blue"
        >
          <ContactMsgs
            messages={messages as any}
            deleteMessage={deleteMessage}
            formatIndiaDateTime={formatIndiaDateTime}
            whatsappDigits={whatsappDigits}
          />
        </AdminAccordion>

        {/* 2. न्यूज़लेटर सदस्य */}
        <AdminAccordion
          icon="📧"
          title="न्यूज़लेटर सदस्य सूची"
          subtitle="सदस्यों के ईमेल देखें और एक्सेल में डाउनलोड करें"
          count={totalSubscribers}
          countLabel="कुल सदस्य"
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

        {/* 3. पोल प्रबंधन */}
        <AdminAccordion
          icon="📊"
          title="पोल प्रबंधन"
          subtitle="पोल खोजें, संपादित करें, विकल्प जोड़ें या हटाएं"
          count={totalPolls}
          countLabel="कुल पोल"
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
              placeholder="पोल के प्रश्न से खोजें..."
              className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              🔍 खोजें
            </button>
            {searchQuery && (
              <Link
                href="/admin"
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-center text-xs font-bold text-gray-700 transition hover:bg-gray-50"
              >
                खोज हटाएं
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