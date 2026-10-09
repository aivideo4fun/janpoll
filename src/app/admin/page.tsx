import Link from 'next/link';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { formatIndiaDate, formatIndiaDateTime, whatsappDigits } from '@/lib/format-india';
import LoginScreen from './components/LoginScreen';
import AdminHeader from './components/AdminHeader';
import ContactMsgs from './components/ContactMsgs';
import Subscribers from './components/Subscribers';
import PollsList from './components/PollsList';
import {
  handleLogout,
  editPoll,
  deletePoll,
  addPollOption,
  deleteMessage,
} from './actions/adminActions';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const SUBSCRIBER_PREVIEW = 100;

type AdminSearchParams = { error?: string; page?: string; search?: string };

export default async function AdminDashboard(props: {
  searchParams?: Promise<AdminSearchParams>;
}) {
  const params = props.searchParams ? await props.searchParams : {};

  if (!(await isAdmin())) {
    return <LoginScreen error={params.error} />;
  }

  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const searchQuery = (params.search ?? '').trim().slice(0, 100);

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

  const [polls, totalPolls, messages, subscribers, totalSubscribers, voteSum] = await Promise.all([
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
          take: SUBSCRIBER_PREVIEW,
        }),
      [] as any[]
    ),
    safe('सदस्य गणना', () => (db as any).newsletterSubscriber.count(), 0),
    safe('कुल मत', () => db.pollOption.aggregate({ _sum: { voteCount: true } }), null as any),
  ]);

  const totalVotes = voteSum?._sum?.voteCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalPolls / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-slate-100 pb-14">
      <AdminHeader
        totalPolls={totalPolls}
        totalVotes={totalVotes}
        totalSubscribers={totalSubscribers}
        totalMessages={messages.length}
        logoutAction={handleLogout}
      />

      <div className="mx-auto mt-8 max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {failed.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            ⚠️ इन अनुभागों का डेटा लोड नहीं हो सका: {failed.join(', ')}। कृपया पेज रीफ़्रेश करें या सर्वर लॉग देखें।
          </div>
        )}

        <ContactMsgs
          messages={messages as any}
          deleteMessage={deleteMessage}
          formatIndiaDateTime={formatIndiaDateTime}
          whatsappDigits={whatsappDigits}
        />

        <Subscribers
          subscribers={subscribers as any}
          total={totalSubscribers}
          formatIndiaDateTime={formatIndiaDateTime}
        />

        {/* पोल खोज */}
        <form
          action="/admin"
          method="get"
          className="flex flex-col gap-2 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:flex-row"
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
      </div>
    </main>
  );
}