import { cookies } from 'next/headers';
import LoginScreen from './components/LoginScreen';
import AdminHeader from './components/AdminHeader';
import { db } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard(props: {
  searchParams?: Promise<{ error?: string; page?: string }>;
}) {
  try {
    const searchParams = props.searchParams ? await props.searchParams : {};
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_session');

    if (!adminAuth || adminAuth.value !== 'authenticated') {
      return <LoginScreen error={searchParams?.error} />;
    }

    const pageParam = searchParams?.page ?? '1';
    const currentPage = Math.max(1, parseInt(pageParam, 10));
    const pageSize = 20;

    let polls: any[] = [];
    let totalPollsCount = 0;
    let contactMessages: any[] = [];
    let subscribers: any[] = [];
    let totalVotes = 0;

    try {
      const rawPolls = await db.poll.findMany({
        orderBy: { createdAt: 'desc' },
        include: { options: true },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      });
      polls = Array.isArray(rawPolls) ? rawPolls : [];
    } catch (e) {
      console.error('पोल लोड त्रुटि:', e);
      polls = [];
    }

    try {
      totalPollsCount = await db.poll.count();
    } catch (e) {
      totalPollsCount = 0;
    }

    try {
      const rawMsgs = await db.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
      });
      contactMessages = Array.isArray(rawMsgs) ? rawMsgs : [];
    } catch (e) {
      contactMessages = [];
    }

    try {
      const rawSubs = await (db as any).newsletterSubscriber.findMany({
        orderBy: { createdAt: 'desc' },
      });
      subscribers = Array.isArray(rawSubs) ? rawSubs : [];
    } catch (e) {
      subscribers = [];
    }

    try {
      const voteSum = await db.pollOption.aggregate({
        _sum: { voteCount: true },
      });
      totalVotes = voteSum?._sum?.voteCount ?? 0;
    } catch (e) {
      totalVotes = 0;
    }

    const totalPages = Math.max(1, Math.ceil(totalPollsCount / pageSize));

    return (
      <main className="min-h-screen bg-slate-100 pb-12">
        {/* @ts-ignore */}
        <AdminHeader totalPolls={totalPollsCount} totalVotes={totalVotes} totalSubscribers={subscribers.length} />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
          
          {/* 1. उपयोगकर्ता संपर्क संदेश अनुभाग */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
            <div className="flex flex-wrap justify-between items-center border-b border-emerald-100 pb-4">
              <h2 className="text-xl font-black text-emerald-950">💬 उपयोगकर्ता संपर्क संदेश</h2>
              <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                कुल संदेश: {contactMessages.length.toLocaleString('en-IN')}
              </span>
            </div>

            {contactMessages.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">अभी तक कोई संपर्क संदेश प्राप्त नहीं हुआ है।</p>
            ) : (
              <div className="space-y-3">
                {contactMessages.map((msg, idx) => (
                  <div key={msg?.id || idx} className="border border-blue-100 rounded-2xl p-4 bg-blue-50/10 space-y-2 shadow-sm">
                    <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2">
                      <span className="font-bold text-gray-800">
                        {msg?.name || 'अज्ञात नाम'} ({msg?.email || 'ईमेल अनुपलब्ध'})
                      </span>
                      <span>{msg?.createdAt ? new Date(msg.createdAt).toLocaleString('hi-IN') : ''}</span>
                    </div>
                    <p className="text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100 leading-relaxed">
                      {msg?.message || 'संदेश उपलब्ध नहीं'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 2. न्यूज़लेटर सब्सक्राइबर सूची अनुभाग */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
            <div className="flex flex-wrap justify-between items-center border-b border-emerald-100 pb-4">
              <h2 className="text-xl font-black text-emerald-950">📧 न्यूज़लेटर सब्सक्राइबर सूची</h2>
              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                कुल सब्सक्राइबर: {subscribers.length.toLocaleString('en-IN')}
              </span>
            </div>
            {subscribers.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">अभी तक कोई सब्सक्राइबर पंजीकृत नहीं है।</p>
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
                      <tr key={sub?.id || index} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-gray-600">{index + 1}</td>
                        <td className="p-3 font-semibold text-gray-800">{sub?.email}</td>
                        <td className="p-3 text-gray-500">{sub?.createdAt ? new Date(sub.createdAt).toLocaleString('hi-IN') : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 3. पोल्स प्रबंधन अनुभाग */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-6">
            <div className="flex flex-wrap justify-between items-center border-b border-emerald-100 pb-4">
              <h2 className="text-xl font-black text-emerald-950">📊 सभी पोल्स का प्रबंधन</h2>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                कुल पंजीकृत पोल: {totalPollsCount.toLocaleString('en-IN')} | कुल वोट: {totalVotes.toLocaleString('en-IN')}
              </span>
            </div>

            {polls.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                डेटाबेस में कोई पोल उपलब्ध नहीं है।
              </div>
            ) : (
              <div className="space-y-4">
                {polls.map((poll, idx) => {
                  const options = Array.isArray(poll?.options) ? poll.options : [];
                  return (
                    <div key={poll?.id || idx} className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/10 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span className="font-semibold text-emerald-800">
                          📍 {[poll?.gramPanchayatName, poll?.samitiName, poll?.districtName].filter(Boolean).join(' · ') || 'राजस्थान'}
                        </span>
                        <span>{poll?.createdAt ? new Date(poll.createdAt).toLocaleDateString('hi-IN') : ''}</span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-emerald-950">{poll?.question || 'शीर्षक उपलब्ध नहीं'}</h3>

                      <div className="space-y-1.5 pl-1">
                        {options.map((opt: any, optIdx: number) => (
                          <div key={opt?.id || optIdx} className="text-xs text-gray-700 flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100">
                            <span>{opt?.text || 'विकल्प'}</span>
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              वोट: {opt?.voteCount ?? 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-gray-100 text-xs font-bold">
                {currentPage > 1 ? (
                  <Link
                    href={`/admin?page=${currentPage - 1}`}
                    className="px-4 py-2 bg-white border border-emerald-200 rounded-xl text-emerald-900 hover:bg-emerald-50 transition shadow-sm"
                  >
                    &larr; पिछला पृष्ठ
                  </Link>
                ) : (
                  <span className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed">
                    &larr; पिछला पृष्ठ
                  </span>
                )}

                <span className="text-gray-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                  पृष्ठ {currentPage} / {totalPages} (प्रति पृष्ठ 20 पोल्स)
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={`/admin?page=${currentPage + 1}`}
                    className="px-4 py-2 bg-white border border-emerald-200 rounded-xl text-emerald-900 hover:bg-emerald-50 transition shadow-sm"
                  >
                    अगला पृष्ठ &rarr;
                  </Link>
                ) : (
                  <span className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed">
                    अगला पृष्ठ &rarr;
                  </span>
                )}
              </div>
            )}
          </section>

        </div>
      </main>
    );
  } catch (error) {
    console.error('एडमिन डैशबोर्ड गंभीर त्रुटि:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-red-200 max-w-md w-full space-y-3">
          <h2 className="text-lg font-bold text-red-700">प्रशासन पोर्टल त्रुटि</h2>
          <p className="text-xs text-gray-600">सर्वर पर कोई तकनीकी समस्या उत्पन्न हुई है। कृपया पुनः प्रयास करें।</p>
          <a href="/admin" className="inline-block bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs">
            पुनः प्रयास करें
          </a>
        </div>
      </div>
    );
  }
}