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
  title: 'Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = {
  error?: string;
};

type AdminPageProps = {
  searchParams: Promise<SearchParams>;
};

type PollData = {
  id: string;
  question: string;
  creatorName: string | null;
  creatorEmail: string | null;
  createdAt: Date;
  active: boolean;
  districtName: string | null;
  samitiName: string | null;
  gramPanchayatName: string | null;
  gramPanchayatId: number | null;
  options: {
    id: string;
    text: string;
    voteCount: number;
    createdAt: Date;
  }[];
};

type MessageData = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  message: string;
  createdAt: Date;
};

/* -----------------------------
   Helpers
------------------------------ */

function formatIndiaDateTime(value: Date | string) {
  return new Intl.DateTimeFormat('hi-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatIndiaDate(value: Date | string) {
  return new Intl.DateTimeFormat('hi-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
  }).format(new Date(value));
}

function whatsappDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

/* -----------------------------
   Login
------------------------------ */

async function handleLogin(formData: FormData) {
  'use server';

  const username = formValue(formData, 'username');
  const password = String(formData.get('password') ?? '');

  if (!adminConfigured()) {
    redirect('/admin?error=config');
  }

  const adminUser = process.env.ADMIN_USER?.trim() ?? '';
  const adminPass = process.env.ADMIN_PASS ?? '';

  if (
    safeEqual(username, adminUser) &&
    safeEqual(password, adminPass)
  ) {
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

/* -----------------------------
   Logout
------------------------------ */

async function handleLogout() {
  'use server';

  await destroyAdminSession();

  const cookieStore = await cookies();
  cookieStore.delete('admin_session');

  redirect('/admin');
}

/* -----------------------------
   Edit poll
------------------------------ */

async function editPoll(formData: FormData) {
  'use server';

  if (!(await isAdmin())) return;

  const pollId = formValue(formData, 'pollId');
  const question = formValue(formData, 'question');
  const creatorName = formValue(formData, 'creatorName');
  const creatorEmail = formValue(formData, 'creatorEmail');
  const districtName = formValue(formData, 'districtName');
  const samitiName = formValue(formData, 'samitiName');
  const gramPanchayatName = formValue(formData, 'gramPanchayatName');
  const gramPanchayatIdValue = formValue(formData, 'gramPanchayatId');
  const activeValue = formValue(formData, 'active');

  if (!pollId || !question) return;

  if (question.length > 500) return;
  if (creatorName.length > 100) return;
  if (creatorEmail.length > 255) return;
  if (districtName.length > 100) return;
  if (samitiName.length > 100) return;
  if (gramPanchayatName.length > 100) return;

  const gramPanchayatId = gramPanchayatIdValue ? String(gramPanchayatIdValue) : null;

  const active = activeValue === 'true';

  const optionIds = formData.getAll('optionId').map(String);
  const optionTexts = formData
    .getAll('optionText')
    .map((value) => String(value).trim());

  try {
    await db.$transaction(async (tx) => {
      await tx.poll.update({
        where: {
          id: pollId,
        },
        data: {
          question,
          creatorName: creatorName || null,
          creatorEmail: creatorEmail || null,
          districtName: districtName || null,
          samitiName: samitiName || null,
          gramPanchayatName: gramPanchayatName || null,
          gramPanchayatId,
          active,
        },
      });

      for (let index = 0; index < optionIds.length; index++) {
        const optionId = optionIds[index];
        const optionText = optionTexts[index];

        if (!optionId || !optionText || optionText.length > 255) {
          continue;
        }

        await tx.pollOption.updateMany({
          where: {
            id: optionId,
            pollId,
          },
          data: {
            text: optionText,
          },
        });
      }
    });

    revalidatePath('/admin');
    revalidatePath('/');
    revalidatePath(`/poll/${pollId}`);
  } catch (error) {
    console.error('Edit poll error:', error);
  }
}

/* -----------------------------
   Delete poll
------------------------------ */

async function deletePoll(formData: FormData) {
  'use server';

  if (!(await isAdmin())) return;

  const pollId = formValue(formData, 'pollId');

  if (!pollId) return;

  try {
    await db.poll.delete({
      where: {
        id: pollId,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/');
  } catch (error) {
    console.error('Delete poll error:', error);
  }
}

/* -----------------------------
   Add poll option
------------------------------ */

async function addPollOption(formData: FormData) {
  'use server';

  if (!(await isAdmin())) return;

  const pollId = formValue(formData, 'pollId');
  const optionText = formValue(formData, 'optionText');

  if (!pollId || !optionText) return;
  if (optionText.length > 255) return;

  try {
    const poll = await db.poll.findUnique({
      where: {
        id: pollId,
      },
      select: {
        id: true,
      },
    });

    if (!poll) return;

    await db.pollOption.create({
      data: {
        pollId,
        text: optionText,
        voteCount: 0,
      },
    });

    revalidatePath('/admin');
    revalidatePath(`/poll/${pollId}`);
  } catch (error) {
    console.error('Add poll option error:', error);
  }
}

/* -----------------------------
   Delete message
------------------------------ */

async function deleteMessage(formData: FormData) {
  'use server';

  if (!(await isAdmin())) return;

  const msgId = formValue(formData, 'msgId');

  if (!msgId) return;

  try {
    await db.contactMessage.delete({
      where: {
        id: msgId,
      },
    });

    revalidatePath('/admin');
  } catch (error) {
    console.error('Delete contact message error:', error);
  }
}

/* -----------------------------
   Login screen
------------------------------ */

function LoginScreen({ error }: { error?: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md px-4 sm:mt-20">
      <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-600 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl">
            🔐
          </div>

          <h1 className="text-2xl font-black">
            एडमिन पोर्टल
          </h1>

          <p className="mt-2 text-xs text-emerald-50">
            केवल अधिकृत प्रशासकों के लिए
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {error === 'invalid' && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-semibold text-red-700">
              यूज़रनेम या पासवर्ड गलत है।
            </div>
          )}

          {error === 'config' && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-semibold text-amber-800">
              सर्वर पर admin credentials सेट नहीं हैं।
            </div>
          )}

          <form action={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-bold text-gray-700"
              >
                यूज़रनेम
              </label>

              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="यूज़रनेम दर्ज करें"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-bold text-gray-700"
              >
                पासवर्ड
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="पासवर्ड दर्ज करें"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              लॉग इन करें
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              ← होम पेज पर वापस जाएं
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   Main admin page
------------------------------ */

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const { error } = await searchParams;

  if (!(await isAdmin())) {
    return <LoginScreen error={error} />;
  }

  let polls: PollData[] = [];
  let messages: MessageData[] = [];
  let loadError = '';

  try {
    polls = await db.poll.findMany({
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
          select: {
            id: true,
            text: true,
            voteCount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    /*
      Existing polls के gramPanchayatId को automatically match करना।
      यह block तभी रखें जब gramPanchayatId का Prisma type String हो।
      आपके दिए schema में gramPanchayatId Int? है, इसलिए नीचे वाला
      auto-link block फिलहाल disable रखा गया है।
    */

    messages = await db.contactMessage.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        message: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Admin data loading error:', error);

    loadError =
      'डेटा लोड नहीं हो पाया। कृपया कुछ समय बाद दोबारा प्रयास करें।';
  }

  const totalVotes = polls.reduce(
    (pollTotal, poll) =>
      pollTotal +
      poll.options.reduce(
        (optionTotal, option) => optionTotal + option.voteCount,
        0
      ),
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 text-white shadow-lg">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-emerald-50">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                सुरक्षित एडमिन एरिया
              </div>

              <h1 className="text-2xl font-black sm:text-3xl">
                एडमिन प्रबंधन डैशबोर्ड
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-emerald-100 sm:text-sm">
                सार्वजनिक पोल्स, वोट्स और यूजर संपर्क संदेशों की निगरानी एवं संचालन करें।
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
              >
                होम →
              </Link>

              <form action={handleLogout}>
                <button
                  type="submit"
                  className="rounded-xl bg-red-500/90 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-600"
                >
                  लॉग आउट
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Error */}
        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
            {loadError}
          </div>
        )}

        {/* Stats */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">
              कुल पोल्स
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-800">
              {polls.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">
              सक्रिय पोल्स
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-800">
              {polls.filter((poll) => poll.active).length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">
              कुल वोट्स
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-800">
              {totalVotes}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">
              संपर्क संदेश
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-800">
              {messages.length}
            </p>
          </div>
        </section>

        {/* Contact Messages */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-emerald-900 sm:text-base">
                ✉️ यूजर संपर्क संदेश
              </h2>

              <p className="mt-1 text-[11px] text-emerald-700">
                Contact Us form से प्राप्त सभी messages
              </p>
            </div>

            <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
              {messages.length}
            </span>
          </div>

          <div className="divide-y divide-emerald-100">
            {messages.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="text-4xl">📭</div>

                <p className="mt-3 text-sm font-semibold text-gray-500">
                  अभी तक कोई संपर्क संदेश प्राप्त नहीं हुआ है।
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const whatsappNumber = msg.whatsapp
                  ? whatsappDigits(msg.whatsapp)
                  : '';

                return (
                  <article
                    key={msg.id}
                    className="p-5 transition hover:bg-emerald-50/30 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-gray-900">
                            {msg.name}
                          </h3>

                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                            संपर्क संदेश
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 text-xs sm:flex-row sm:flex-wrap sm:gap-4">
                          <a
                            href={`mailto:${msg.email}`}
                            className="font-semibold text-emerald-700 hover:underline"
                          >
                            📧 {msg.email}
                          </a>

                          {msg.whatsapp ? (
                            <a
                              href={
                                whatsappNumber
                                  ? `https://wa.me/${whatsappNumber}`
                                  : '#'
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-green-700 hover:underline"
                            >
                              📱 WhatsApp: {msg.whatsapp}
                            </a>
                          ) : (
                            <span className="text-gray-400">
                              📱 WhatsApp नंबर नहीं दिया गया
                            </span>
                          )}
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {msg.message}
                          </p>
                        </div>

                        <p className="text-[11px] text-gray-400">
                          प्राप्त हुआ: {formatIndiaDateTime(msg.createdAt)}
                        </p>
                      </div>

                      <form
                        action={deleteMessage}
                        className="lg:pt-1"
                      >
                        <input
                          type="hidden"
                          name="msgId"
                          value={msg.id}
                        />

                        <button
                          type="submit"
                          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 lg:w-auto"
                        >
                          संदेश डिलीट करें
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* Polls */}
        <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-emerald-900 sm:text-base">
                📊 पंजीकृत पोल्स
              </h2>

              <p className="mt-1 text-[11px] text-emerald-700">
                सभी public polls और उनके options
              </p>
            </div>

            <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
              {polls.length}
            </span>
          </div>

          <div className="divide-y divide-emerald-100">
            {polls.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="text-4xl">📊</div>

                <p className="mt-3 text-sm font-semibold text-gray-500">
                  डेटाबेस में कोई पोल उपलब्ध नहीं है।
                </p>
              </div>
            ) : (
              polls.map((poll) => {
                const pollTotalVotes = poll.options.reduce(
                  (sum, option) => sum + option.voteCount,
                  0
                );

                return (
                  <article
                    key={poll.id}
                    className="p-5 transition hover:bg-emerald-50/20 sm:p-6"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                poll.active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {poll.active
                                ? '● सक्रिय'
                                : '○ निष्क्रिय'}
                            </span>

                            <span className="text-[11px] text-gray-400">
                              {formatIndiaDate(poll.createdAt)}
                            </span>
                          </div>

                          <h3 className="text-lg font-black leading-7 text-gray-900">
                            {poll.question}
                          </h3>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                            <span>
                              👤{' '}
                              <strong className="text-gray-700">
                                {poll.creatorName || 'गुमनाम'}
                              </strong>
                            </span>

                            <span>
                              📧{' '}
                              <strong className="text-gray-700">
                                {poll.creatorEmail || 'ईमेल उपलब्ध नहीं'}
                              </strong>
                            </span>

                            <span>
                              👥{' '}
                              <strong className="text-gray-700">
                                {pollTotalVotes} वोट
                              </strong>
                            </span>

                            {poll.districtName && (
                              <span>
                                📍{' '}
                                <strong className="text-gray-700">
                                  {poll.districtName}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Link
                            href={`/poll/${poll.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                          >
                            पोल देखें →
                          </Link>

                          <form action={deletePoll}>
                            <input
                              type="hidden"
                              name="pollId"
                              value={poll.id}
                            />

                            <button
                              type="submit"
                              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                            >
                              पोल डिलीट करें
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Edit Poll Form */}
                      <details className="group rounded-2xl border border-blue-200 bg-blue-50/40">
                        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-blue-900">
                          <span className="mr-2 inline-block transition group-open:rotate-90">
                            ▶
                          </span>
                          इस पोल को एडिट करें
                        </summary>

                        <div className="border-t border-blue-200 p-4">
                          <form action={editPoll} className="space-y-4">
                            <input
                              type="hidden"
                              name="pollId"
                              value={poll.id}
                            />

                            <div>
                              <label
                                htmlFor={`question-${poll.id}`}
                                className="mb-1.5 block text-xs font-bold text-gray-700"
                              >
                                पोल की heading / question
                              </label>

                              <textarea
                                id={`question-${poll.id}`}
                                name="question"
                                required
                                maxLength={500}
                                defaultValue={poll.question}
                                rows={3}
                                className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label
                                  htmlFor={`creatorName-${poll.id}`}
                                  className="mb-1.5 block text-xs font-bold text-gray-700"
                                >
                                  Creator name
                                </label>

                                <input
                                  id={`creatorName-${poll.id}`}
                                  name="creatorName"
                                  type="text"
                                  maxLength={100}
                                  defaultValue={poll.creatorName ?? ''}
                                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`creatorEmail-${poll.id}`}
                                  className="mb-1.5 block text-xs font-bold text-gray-700"
                                >
                                  Creator email
                                </label>

                                <input
                                  id={`creatorEmail-${poll.id}`}
                                  name="creatorEmail"
                                  type="email"
                                  maxLength={255}
                                  defaultValue={poll.creatorEmail ?? ''}
                                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                              <div>
                                <label
                                  htmlFor={`districtName-${poll.id}`}
                                  className="mb-1.5 block text-xs font-bold text-gray-700"
                                >
                                  जिला
                                </label>

                                <input
                                  id={`districtName-${poll.id}`}
                                  name="districtName"
                                  type="text"
                                  maxLength={100}
                                  defaultValue={poll.districtName ?? ''}
                                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`samitiName-${poll.id}`}
                                  className="mb-1.5 block text-xs font-bold text-gray-700"
                                >
                                  पंचायत समिति
                                </label>

                                <input
                                  id={`samitiName-${poll.id}`}
                                  name="samitiName"
                                  type="text"
                                  maxLength={100}
                                  defaultValue={poll.samitiName ?? ''}
                                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor={`gramPanchayatName-${poll.id}`}
                                  className="mb-1.5 block text-xs font-bold text-gray-700"
                                >
                                  ग्राम पंचायत
                                </label>

                                <input
                                  id={`gramPanchayatName-${poll.id}`}
                                  name="gramPanchayatName"
                                  type="text"
                                  maxLength={100}
                                  defaultValue={poll.gramPanchayatName ?? ''}
                                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                              </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label
                                  htmlFor={`gramPanchayatId-${poll.id}`}
                                  className="mb-1.5 block text-xs font-bold text-gray-700"
                                >
                                  Gram Panchayat ID
                                </label>

                                <input
                                  id={`gramPanchayatId-${poll.id}`}
                                  name="gramPanchayatId"
                                  type="number"
                                  min={1}
                                  defaultValue={
                                    poll.gramPanchayatId ?? ''
                                  }
                                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <p className="mt-1 text-[10px] text-gray-500">
                                  यदि ID उपलब्ध नहीं है तो खाली छोड़ें।
                                </p>
                              </div>

                              <div>
                                <label
                                  htmlFor={`active-${poll.id}`}
                                  className="mb-1.5 block text-xs font-bold text-gray-700"
                                >
                                  Poll status
                                </label>

                                <select
                                  id={`active-${poll.id}`}
                                  name="active"
                                  defaultValue={
                                    poll.active ? 'true' : 'false'
                                  }
                                  className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                  <option value="true">
                                    सक्रिय
                                  </option>
                                  <option value="false">
                                    निष्क्रिय
                                  </option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-black text-gray-700">
                                  Poll options edit करें
                                </p>

                                <span className="text-[10px] text-gray-500">
                                  Votes सुरक्षित रहेंगे
                                </span>
                              </div>

                              <div className="space-y-2">
                                {poll.options.map((option) => (
                                  <div
                                    key={option.id}
                                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                                  >
                                    <input
                                      type="hidden"
                                      name="optionId"
                                      value={option.id}
                                    />

                                    <input
                                      type="text"
                                      name="optionText"
                                      required
                                      maxLength={255}
                                      defaultValue={option.text}
                                      className="min-w-0 flex-1 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />

                                    <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-2 text-center text-[10px] font-black text-emerald-800">
                                      {option.voteCount} वोट
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                              <button
                                type="submit"
                                className="rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-blue-800"
                              >
                                ✓ बदलाव सुरक्षित करें
                              </button>
                            </div>
                          </form>
                        </div>
                      </details>

                      {/* Existing options and add option */}
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-black text-emerald-900">
                            मौजूदा विकल्प
                          </p>

                          <span className="text-[10px] font-semibold text-gray-500">
                            {poll.options.length} विकल्प
                          </span>
                        </div>

                        {poll.options.length === 0 ? (
                          <p className="mb-4 text-xs text-gray-500">
                            इस पोल में अभी कोई option नहीं है।
                          </p>
                        ) : (
                          <div className="mb-4 grid gap-2 sm:grid-cols-2">
                            {poll.options.map((option) => (
                              <div
                                key={option.id}
                                className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2.5"
                              >
                                <span className="min-w-0 truncate text-xs font-semibold text-gray-700">
                                  {option.text}
                                </span>

                                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-800">
                                  {option.voteCount} वोट
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <form
                          action={addPollOption}
                          className="flex flex-col gap-2 sm:flex-row"
                        >
                          <input
                            type="hidden"
                            name="pollId"
                            value={poll.id}
                          />

                          <input
                            type="text"
                            name="optionText"
                            required
                            maxLength={255}
                            placeholder="नया विकल्प यहाँ जोड़ें..."
                            className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />

                          <button
                            type="submit"
                            className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
                          >
                            + विकल्प जोड़ें
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <footer className="py-8 text-center text-[11px] text-gray-400">
          Admin dashboard • सभी समय IST में दिखाए जा रहे हैं
        </footer>
      </div>
    </main>
  );
}