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
  const resolvedSearchParams = await searchParams;
  const cookieStore = cookies();
  const adminAuth = cookieStore.get('admin_session');

  // यदि एडमिन लॉग इन नहीं है, तो लॉगिन स्क्रीन दिखाएं और URL का error पास करें
  if (!adminAuth || adminAuth.value !== 'authenticated') {
    return <LoginScreen error={resolvedSearchParams.error} />;
  }

  // (बाकी का आपका एडमिन डैशबोर्ड कोड...)
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
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
          <h2 className="text-xl font-black text-emerald-950 mb-4">📊 सभी पोल्स का प्रबंधन</h2>
          {/* @ts-ignore */}
          <PollsList polls={polls} />
        </section>
      </div>
    </main>
  );
}