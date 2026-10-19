import Link from 'next/link';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';

import { db } from '@/lib/db';
import { googleAuthOptions } from '@/lib/google-auth';

import {
  ProfileLogin,
  ProfileNameForm,
  LogoutButton,
} from './ProfileControls';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'मेरी प्रोफाइल | JanPoll India',
  description: 'अपनी JanPoll profile देखें और नाम अपडेट करें।',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const session = await getServerSession(googleAuthOptions);

  const userId = (
    session?.user as { id?: unknown } | undefined
  )?.id;

  if (!session?.user) {
    return (
      <main
        lang="hi"
        className="min-h-[80vh] bg-[#F5F8F6] px-4 py-10 sm:py-16"
      >
        <section className="mx-auto max-w-xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-semibold tracking-widest text-emerald-700">
            JANPOLL / MY ACCOUNT
          </p>

          <h1 className="mt-4 text-3xl font-semibold leading-normal text-emerald-950">
            आपकी आवाज़, आपकी पहचान
          </h1>

          <p className="mb-6 mt-4 text-sm leading-8 text-slate-500">
            अपनी profile देखने और नाम अपडेट करने के लिए login करें।
          </p>

          <ProfileLogin />

          <Link
            href="/"
            className="mt-6 inline-block text-sm leading-7 text-emerald-800 hover:underline"
          >
            ← होम पर जाएँ
          </Link>
        </section>
      </main>
    );
  }

  if (typeof userId !== 'string' || !userId) {
    return (
      <main lang="hi" className="min-h-[70vh] bg-[#F5F8F6] px-4 py-12">
        <section className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-6">
          <h1 className="text-xl font-semibold leading-9 text-emerald-950">
            Session दोबारा शुरू करें
          </h1>

          <p className="my-4 text-sm leading-7 text-slate-600">
            आपकी session में user ID उपलब्ध नहीं है।
            Logout करके फिर से login करें।
          </p>

          <LogoutButton />
        </section>
      </main>
    );
  }

  let user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;

  try {
    user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  } catch (error) {
    console.error('Profile load failed', error);

    return (
      <main lang="hi" className="min-h-[70vh] bg-[#F5F8F6] px-4 py-12">
        <section className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-6">
          <h1 className="text-xl font-semibold leading-9 text-emerald-950">
            Profile लोड नहीं हो सकी
          </h1>

          <p role="alert" className="mt-4 text-sm leading-7 text-slate-600">
            Local database connection जाँचें और page दोबारा खोलें।
          </p>

          <Link
            href="/profile"
            className="mt-5 inline-block text-sm leading-7 text-emerald-800 underline"
          >
            दोबारा कोशिश करें
          </Link>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main lang="hi" className="min-h-[70vh] bg-[#F5F8F6] px-4 py-12">
        <section className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-6">
          <h1 className="text-xl font-semibold leading-9 text-emerald-950">
            Account उपलब्ध नहीं है
          </h1>

          <p className="my-4 text-sm leading-7 text-slate-600">
            Logout करके फिर से login करें।
          </p>

          <LogoutButton />
        </section>
      </main>
    );
  }

  const displayName = user.name?.trim() || 'JanPoll User';
  const initial = Array.from(displayName)[0] || 'J';

  return (
    <main
      lang="hi"
      className="min-h-screen bg-[#F5F8F6] px-4 py-8 text-slate-800 sm:py-12"
    >
      <div className="mx-auto max-w-4xl">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs leading-7 text-slate-500"
        >
          <Link href="/" className="hover:text-emerald-800">
            होम
          </Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">मेरी प्रोफाइल</span>
        </nav>

        <section className="mt-6 rounded-3xl bg-emerald-900 p-6 text-white sm:p-9">
          <p className="text-xs font-semibold tracking-widest text-emerald-200">
            JANPOLL / MY PROFILE
          </p>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              aria-hidden="true"
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-emerald-500 bg-emerald-800 text-3xl font-semibold leading-none"
            >
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="break-words text-2xl font-semibold leading-normal sm:text-3xl">
                {displayName}
              </h1>

              <p className="mt-2 break-all text-sm leading-7 text-emerald-100">
                {user.email || 'Email उपलब्ध नहीं है'}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid items-start gap-5 md:grid-cols-3">
          <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7 md:col-span-2">
            <h2 className="text-xl font-semibold leading-9 text-emerald-950">
              Profile details
            </h2>

            <p className="mb-6 mt-2 text-sm leading-7 text-slate-500">
              यहाँ अपना नाम अपडेट कर सकते हैं।
            </p>

            <Link href="/my-polls" className="my-4 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-5 text-white">मेरे पोल और Reference IDs →</Link>
          <ProfileNameForm initialName={user.name ?? ''} />

            <div className="mt-7 border-t border-slate-100 pt-5">
              <p className="text-sm font-medium leading-7 text-slate-700">
                Account email
              </p>

              <p className="mt-2 break-all text-sm leading-7 text-slate-500">
                {user.email || 'Email उपलब्ध नहीं है'}
              </p>

              <p className="mt-2 text-xs leading-7 text-slate-400">
                Email इस page से बदला नहीं जा सकता।
              </p>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-emerald-100 bg-white p-5">
              <h2 className="text-base font-semibold leading-8 text-emerald-950">
                अपनी राय सामने रखें
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                नया सवाल पूछें या अपने राज्य के पोल देखें।
              </p>

              <div className="mt-4 grid gap-3">
                <Link
                  href="/create"
                  className="rounded-xl bg-emerald-800 px-4 py-3 text-center text-sm font-semibold leading-7 text-white hover:bg-emerald-900"
                >
                  ＋ पोल बनाएँ
                </Link>

                <Link
                  href="/states"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm leading-7 text-slate-700 hover:bg-slate-50"
                >
                  पोल देखें →
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-base font-semibold leading-8 text-slate-800">
                Account
              </h2>

              <LogoutButton />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}