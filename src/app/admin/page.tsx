import { cookies } from 'next/headers';
import LoginScreen from './components/LoginScreen';
import AdminHeader from './components/AdminHeader';
import PollsList from './components/PollsList';
import ContactMsgs from './components/ContactMsgs';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pass?: string }>;
}) {
  try {
    const resolvedSearchParams = await searchParams;
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_session');

    // Agar admin logged in nahi hai, toh login screen dikhayein
    if (!adminAuth || adminAuth.value !== 'authenticated') {
      return <LoginScreen error={resolvedSearchParams?.error} />;
    }

    let polls: any[] = [];
    let contactMessages: any[] = [];
    let subscribers: any[] = [];
    let totalVotes = 0;

    try {
      polls = await db.poll.findMany({
        orderBy: { createdAt: 'desc' },
        include: { options: true },
      });

      contactMessages = await db.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
      });

      try {
        subscribers = await (db as any).newsletterSubscriber.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        subscribers = [];
      }

      const voteSum = await db.pollOption.aggregate({
        _sum: { voteCount: true },
      });
      totalVotes = voteSum._sum.voteCount ?? 0;
    } catch (dbErr) {
      console.error('Database fetch error in admin:', dbErr);
    }

    return (
      <main className="min-h-screen bg-slate-100 pb-12">
        {/* @ts-ignore */}
        <AdminHeader totalPolls={polls.length} totalVotes={totalVotes} totalSubscribers={subscribers.length} />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
          
          {/* Poल्स प्रबंधन सेक्शन */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
            <h2 className="text-xl font-black text-emerald-950 mb-4">📊 Sabhi Polls ka Prabandhan</h2>
            {/* @ts-ignore */}
            <PollsList polls={polls} />
          </section>

          {/* Newsletter Subscribers Section */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
            <h2 className="text-xl font-black text-emerald-950">📧 Newsletter Subscriber List ({subscribers.length})</h2>
            {subscribers.length === 0 ? (
              <p className="text-xs text-gray-500">Abhi tak koi subscriber nahi hai.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-100">
                    <tr>
                      <th className="p-3">Kramank</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Subscribe Tithi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscribers.map((sub, index) => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-gray-600">{index + 1}</td>
                        <td className="p-3 font-semibold text-gray-800">{sub.email}</td>
                        <td className="p-3 text-gray-500">{new Date(sub.createdAt).toLocaleString('hi-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Contact Messages Section */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
            <h2 className="text-xl font-black text-emerald-950 mb-4">💬 Sampark Sandesh</h2>
            {/* @ts-ignore */}
            <ContactMsgs messages={contactMessages} />
          </section>

        </div>
      </main>
    );
  } catch (error) {
    console.error('Admin page critical error:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-red-200 max-w-md w-full space-y-3">
          <h2 className="text-lg font-bold text-red-700">Admin Portal Error</h2>
          <p className="text-xs text-gray-600">Server mein koi samasya aayi hai. Kripya terminal logs check karein.</p>
          <a href="/admin" className="inline-block bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs">
            Punah Prayas Karein
          </a>
        </div>
      </div>
    );
  }
}