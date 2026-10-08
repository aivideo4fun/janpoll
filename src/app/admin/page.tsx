import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { db } from '@/lib/db';
import {
  adminConfigured,
  createAdminSession,
  destroyAdminSession,
  isAdmin,
  safeEqual,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
};

async function handleLogin(formData: FormData) {
  'use server';

  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!adminConfigured()) {
    redirect('/admin?error=config');
  }

  const adminUser = process.env.ADMIN_USER!.trim();
  const adminPass = process.env.ADMIN_PASS!.trim();

  if (safeEqual(username, adminUser) && safeEqual(password, adminPass)) {
    await createAdminSession();

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'admin_session',
      value: 'authenticated',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    redirect('/admin');
  }

  redirect('/admin?error=invalid');
}

async function handleLogout() {
  'use server';
  await destroyAdminSession();

  const cookieStore = await cookies();
  cookieStore.delete('admin_session');

  redirect('/admin');
}

async function deletePoll(formData: FormData) {
  'use server';

  if (!(await isAdmin())) return;

  const pollId = String(formData.get('pollId') ?? '');
  if (!pollId) return;

  await db.poll.delete({ where: { id: pollId } });
  revalidatePath('/admin');
  revalidatePath('/');
}

// 🛠️ Admin dwara naya option jodne ka action
async function addPollOption(formData: FormData) {
  'use server';

  if (!(await isAdmin())) return;

  const pollId = String(formData.get('pollId') ?? '');
  const optionText = String(formData.get('optionText') ?? '').trim();

  if (!pollId || !optionText) return;

  await db.pollOption.create({
    data: {
      pollId,
      text: optionText,
      voteCount: 0,
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/poll/${pollId}`);
}

async function deleteMessage(formData: FormData) {
  'use server';

  if (!(await isAdmin())) return;

  const msgId = String(formData.get('msgId') ?? '');
  if (!msgId) return;

  await db.contactMessage.delete({ where: { id: msgId } });
  revalidatePath('/admin');
}

type AdminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { error } = await searchParams;

  if (!(await isAdmin())) {
    return (
      <div className="max-w-md mx-auto mt-20 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-emerald-100">
          <h1 className="text-2xl font-black text-emerald-900 mb-2 text-center">
            🔐 एडमिन पोर्टल प्रमाणीकरण
          </h1>
          <p className="text-xs text-gray-500 mb-6 text-center">
            केवल अधिकृत प्रशासकों के लिए। कृपया अपने क्रेडेंशियल्स दर्ज करें।
          </p>

          {error === 'invalid' && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-semibold text-red-700">
              यूज़रनेम या पासवर्ड गलत है।
            </div>
          )}

          {error === 'config' && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-semibold text-amber-800">
              सर्वर पर एडमिन क्रेडेंशियल्स सेट नहीं हैं।
            </div>
          )}

          <form action={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">यूज़रनेम (Username)</label>
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="यूज़रनेम दर्ज करें"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">पासवर्ड (Password)</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="पासवर्ड दर्ज करें"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition shadow"
            >
              लॉग इन करें
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-emerald-700 font-semibold underline">
              &larr; होम पेज पर वापस जाएं
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let polls: Array<{
    id: string;
    question: string;
    creatorName: string | null;
    creatorEmail: string | null;
    createdAt: Date;
    active: boolean;
    options: { id: string; text: string; voteCount: number; createdAt: Date }[];
  }> = [];

  let messages: Array<{
    id: string;
    name: string;
    email: string;
    whatsapp?: string | null; // 👈 yahan ? lagane se type error khatam ho jayegi
    message: string;
    createdAt: Date;
  }> = [];

  try {
    polls = await db.poll.findMany({
      select: {
        id: true,
        question: true,
        creatorName: true,
        creatorEmail: true,
        createdAt: true,
        active: true,
        options: { select: { id: true, text: true, voteCount: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    messages = await db.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('एडमिन डेटा लोड करने में त्रुटि:', err);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-gray-800">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
        <div>
          <h1 className="text-2xl font-black text-emerald-900">🛠 एडमिन प्रबंधन डैशबोर्ड</h1>
          <p className="text-xs text-gray-500 mt-1">
            सार्वजनिक पोल्स और यूजर संदेशों की निगरानी, समीक्षा और संचालन करें।
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200"
          >
            होम &rarr;
          </Link>
          <form action={handleLogout}>
            <button
              type="submit"
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition"
            >
              लॉग आउट
            </button>
          </form>
        </div>
      </div>

      {/* ✉️ Contact Messages Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden mb-8">
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 font-bold text-sm text-emerald-900 flex justify-between">
          <span>✉️ यूजर संपर्क संदेश (Contact Messages)</span>
          <span>{messages.length}</span>
        </div>

        <div className="divide-y divide-emerald-100">
          {messages.length === 0 ? (
            <p className="p-8 text-center text-gray-500 text-sm">
              अभी तक कोई संपर्क संदेश प्राप्त नहीं हुआ है।
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-gray-900">{msg.name}</h3>
                  <div className="text-xs text-emerald-700 font-semibold flex flex-wrap gap-4">
                    <span>📧 {msg.email}</span>
                    {msg.whatsapp && (
                      <span className="text-green-700 font-bold">📱 WhatsApp: {msg.whatsapp}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
                    {msg.message}
                  </p>
                  <span className="text-[10px] text-gray-400">
                    प्राप्त हुआ: {new Date(msg.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <form action={deleteMessage} className="self-end md:self-center">
                  <input type="hidden" name="msgId" value={msg.id} />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition"
                  >
                    संदेश डिलीट करें
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Polls Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden mb-8">
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 font-bold text-sm text-emerald-900 flex justify-between">
          <span>कुल पंजीकृत पोल्स</span>
          <span>{polls.length}</span>
        </div>

        <div className="divide-y divide-emerald-100">
          {polls.length === 0 ? (
            <p className="p-8 text-center text-gray-500 text-sm">
              डेटाबेस में कोई पोल उपलब्ध नहीं है।
            </p>
          ) : (
            polls.map((poll) => {
              const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

              return (
                <div key={poll.id} className="p-5 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-gray-900">{poll.question}</h3>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                        <span>👤 निर्माता: {poll.creatorName || 'गुमनाम (Anonymous)'}</span>
                        <span>📧 ईमेल: {poll.creatorEmail || 'उपलब्ध नहीं'}</span>
                        <span>👥 कुल वोट: {totalVotes}</span>
                        <span>📅 दिनांक: {new Date(poll.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                        <span>{poll.active ? '🟢 सक्रिय' : '⚪ निष्क्रिय'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Link
                        href={`/poll/${poll.id}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition"
                      >
                        देखें &rarr;
                      </Link>
                      <form action={deletePoll}>
                        <input type="hidden" name="pollId" value={poll.id} />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition"
                        >
                          पोल डिलीट करें
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Existing Options List & Add New Option Form */}
                  <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-3">
                    <p className="text-xs font-bold text-emerald-900">मौजूदा विकल्प:</p>
                    <div className="flex flex-wrap gap-2">
                      {poll.options.map((opt) => (
                        <span
                          key={opt.id}
                          className="bg-white px-3 py-1 rounded-lg text-xs border border-emerald-200 text-gray-700 font-medium"
                        >
                          {opt.text} <span className="text-emerald-700 font-bold">({opt.voteCount} वोट)</span>
                        </span>
                      ))}
                    </div>

                    {/* Admin option adder form */}
                    <form action={addPollOption} className="flex gap-2 pt-2">
                      <input type="hidden" name="pollId" value={poll.id} />
                      <input
                        type="text"
                        name="optionText"
                        placeholder="नया विकल्प यहाँ जोड़ें..."
                        required
                        className="flex-1 px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-sm"
                      >
                        + विकल्प जोड़ें
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}