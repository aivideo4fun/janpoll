import { db } from '@/lib/db';
import AdminHeader from './components/AdminHeader';
import PollsList from './components/PollsList';
import ContactMsgs from './components/ContactMsgs';
import LoginScreen from './components/LoginScreen';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const cookieStore = cookies();
  const adminAuth = cookieStore.get('janpoll_admin_auth');

  if (!adminAuth || adminAuth.value !== 'true') {
    return <LoginScreen />;
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
  } catch (error) {
    console.error('एडमिन डेटा लोड करने में त्रुटि:', error);
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-12">
      {/* @ts-ignore */}
      <AdminHeader totalPolls={polls.length} totalVotes={totalVotes} totalSubscribers={subscribers.length} />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        
        {/* पोल्स प्रबंधन सेक्शन */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
          <h2 className="text-xl font-black text-emerald-950 mb-4">📊 सभी पोल्स का प्रबंधन</h2>
          {/* @ts-ignore */}
<PollsList 
  polls={polls} 
  totalPolls={polls.length} 
  searchQuery="" 
  selectedDistrict="" 
  districts={[]} 
/>
        </section>

        {/* न्यूज़लेटर सब्सक्राइबर सेक्शन */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
          <h2 className="text-xl font-black text-emerald-950">📧 न्यूज़लेटर सब्सक्राइबर लिस्ट ({subscribers.length})</h2>
          {subscribers.length === 0 ? (
            <p className="text-xs text-gray-500">अभी तक कोई सब्सक्राइबर नहीं है।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-100">
                  <tr>
                    <th className="p-3">क्रम संख्या</th>
                    <th className="p-3">ईमेल एड्रेस</th>
                    <th className="p-3">सब्सक्राइब तिथि</th>
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

        {/* संपर्क संदेश सेक्शन */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
          <h2 className="text-xl font-black text-emerald-950 mb-4">💬 संपर्क संदेश</h2>
          {/* @ts-ignore */}
          <ContactMsgs messages={contactMessages} />
        </section>

      </div>
    </main>
  );
}