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
  title: 'प्रशासक डैशबोर्ड',
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
  tab?: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const error = params.error;
  const searchQuery = params.search?.trim() || '';
  const currentPage = Math.max(1, Number(params.page) || 1);
  const currentTab = params.tab || 'polls'; // Default tab polls rahega
  const pageSize = 10;

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
    console.error('डेटा लोड त्रुटि:', err);
    loadError = 'डेटा लोड करने में समस्या आई। कृपया कुछ समय पश्चात पुनः प्रयास करें।';
  }

  const totalPages = Math.max(1, Math.ceil(totalPolls / pageSize));
  const totalVotes = polls.reduce(
    (sum, poll) => sum + poll.options.reduce((optSum: number, opt: any) => optSum + opt.voteCount, 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 space-y-8">
        
        {/* प्रशासक हेडर */}
        <AdminHeader handleLogout={handleLogout} />

        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
            {loadError}
          </div>
        )}

        {/* सांख्यिकी (Stats) */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">कुल पोल्स (परिणाम)</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{totalPolls}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">सक्रिय पोल्स</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{polls.filter(p => p.active).length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">कुल मत (Votes)</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{totalVotes}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">संपर्क संदेश</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{messages.length}</p>
          </div>
        </section>

        {/* टैब नेविगेशन बटन (Tab Switching) */}
        <div className="flex border-b border-emerald-200 gap-4">
          <Link
            href="/admin?tab=polls"
            className={`pb-3 px-4 text-sm font-black transition border-b-2 ${
              currentTab === 'polls'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-emerald-700'
            }`}
          >
            📊 पंजीकृत पोल्स मैनेजमेंट ({totalPolls})
          </Link>
          <Link
            href="/admin?tab=messages"
            className={`pb-3 px-4 text-sm font-black transition border-b-2 flex items-center gap-2 ${
              currentTab === 'messages'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-emerald-700'
            }`}
          >
            ✉️ उपयोगकर्ता संपर्क संदेश
            <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] text-white">
              {messages.length}
            </span>
          </Link>
        </div>

        {/* टैब के आधार पर कंटेंट दिखाना */}
        {currentTab === 'messages' ? (
          <ContactMsgs
            messages={messages}
            deleteMessage={deleteMessage}
            formatIndiaDateTime={formatIndiaDateTime}
            whatsappDigits={whatsappDigits}
          />
        ) : (
          <div className="space-y-6">
            {/* खोज बार (Search Bar सिर्फ पोल्स टैब में दिखेगा) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
              <form method="GET" className="flex gap-2">
                <input type="hidden" name="tab" value="polls" />
                <input
                  type="text"
                  name="search"
                  defaultValue={searchQuery}
                  placeholder="पोल प्रश्न, निर्माता या जिला द्वारा खोजें..."
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                />
                <button type="submit" className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition hover:bg-emerald-800">
                  खोजें
                </button>
                {searchQuery && (
                  <Link href="/admin?tab=polls" className="bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center transition">
                    साफ करें
                  </Link>
                )}
              </form>
            </div>

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
        )}

      </div>
    </main>
  );
}