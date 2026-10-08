import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import { handleLogout, deletePoll, editPoll, addPollOption, deleteMessage } from './actions/adminActions';
import LoginScreen from './components/LoginScreen';
import AdminHeader from './components/AdminHeader';
import ContactMsgs from './components/ContactMsgs';
import PollsList from './components/PollsList';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

function formatIndiaDate(value: Date | string) {
  return new Intl.DateTimeFormat('hi-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
  }).format(new Date(value));
}

function formatIndiaDateTime(value: Date | string) {
  return new Intl.DateTimeFormat('hi-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function whatsappDigits(value: string) {
  return value.replace(/\D/g, '');
}

type SearchParams = {
  error?: string;
  search?: string;
  page?: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const error = params.error;
  const searchQuery = params.search?.trim() || '';
  const currentPage = Number(params.page) || 1;
  const pageSize = 10; // Page hang hone se bachane ke liye limit 10

  if (!(await isAdmin())) {
    return <LoginScreen error={error} />;
  }

  let polls: any[] = [];
  let totalPolls = 0;
  let messages: any[] = [];
  let loadError = '';

  try {
    const whereCondition = searchQuery
      ? {
          OR: [
            { question: { contains: searchQuery, mode: 'insensitive' as any } },
            { creatorName: { contains: searchQuery, mode: 'insensitive' as any } },
            { districtName: { contains: searchQuery, mode: 'insensitive' as any } },
          ],
        }
      : {};

    totalPolls = await db.poll.count({ where: whereCondition });

    polls = await db.poll.findMany({
      where: whereCondition,
      select: {
        id: true,
        question: true,
        creatorName: true,
        creatorEmail: true,
        createdAt: true,
        active: true,
        districtName: true,
        samitiName: true,
        gramPanchayatName: true,
        gramPanchayatId: true,
        options: {
          select: { id: true, text: true, voteCount: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    });

    messages = await db.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Admin load error:', err);
    loadError = 'Data load karne mein samasya aayi. Kripya punah prayas karein.';
  }

  const totalPages = Math.ceil(totalPolls / pageSize);
  const totalVotes = polls.reduce(
    (sum, poll) => sum + poll.options.reduce((optSum: number, opt: any) => optSum + opt.voteCount, 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 space-y-8">
        
        {/* Admin Header Component */}
        <AdminHeader handleLogout={handleLogout} />

        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
            {loadError}
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
          <form method="GET" className="flex gap-2">
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="Poll question, creator ya district se search karein..."
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
            />
            <button type="submit" className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold">
              Search
            </button>
            {searchQuery && (
              <Link href="/admin" className="bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center">
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Stats Section */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Filtered Polls</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{totalPolls}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Sakriya Polls</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{polls.filter(p => p.active).length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Total Votes</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{totalVotes}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Sampark Sandesh</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{messages.length}</p>
          </div>
        </section>

        {/* Contact Messages Component */}
        <ContactMsgs
          messages={messages}
          deleteMessage={deleteMessage}
          formatIndiaDateTime={formatIndiaDateTime}
          whatsappDigits={whatsappDigits}
        />

        {/* Polls List Component with Pagination */}
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