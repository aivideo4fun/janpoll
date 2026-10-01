import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import {
  adminConfigured,
  createAdminSession,
  destroyAdminSession,
  isAdmin,
  safeEqual,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// Search engines में admin page न दिखे
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
    redirect('/admin');
  }

  redirect('/admin?error=invalid');
}

async function handleLogout() {
  'use server';
  await destroyAdminSession();
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
            🔐 Admin Portal Authentication
          </h1>
          <p className="text-xs text-gray-500 mb-6 text-center">
            Authorized Personnel Only. Please enter your credentials.
          </p>

          {error === 'invalid' && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-xs font-semibold text-red-700">
              Username या Password गलत है।
            </div>
          )}

          {error === 'config' && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-semibold text-amber-800">
              Server पर ADMIN_USER, ADMIN_PASS या ADMIN_SECRET सेट नहीं है।
              Environment Variables जाँचकर Redeploy करें।
            </div>
          )}

          <form action={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                name="username"
                required
                autoComplete="username"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition shadow"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-emerald-700 font-semibold underline">
              &larr; Return to Home Page
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
    options: { voteCount: number }[];
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
        options: { select: { voteCount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('Error loading admin polls:', err);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-gray-800">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
        <div>
          <h1 className="text-2xl font-black text-emerald-900">🛠 Admin Management Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitor, review, and moderate user-generated public polls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200"
          >
            Home &rarr;
          </Link>
          <form action={handleLogout}>
            <button
              type="submit"
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 font-bold text-sm text-emerald-900 flex justify-between">
          <span>Total Registered Polls</span>
          <span>{polls.length}</span>
        </div>

        <div className="divide-y divide-emerald-100">
          {polls.length === 0 ? (
            <p className="p-8 text-center text-gray-500 text-sm">
              No polls available in the database.
            </p>
          ) : (
            polls.map((poll) => {
              const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

              return (
                <div
                  key={poll.id}
                  className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900">{poll.question}</h3>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                      <span>👤 Creator: {poll.creatorName || 'Anonymous'}</span>
                      <span>📧 Email: {poll.creatorEmail || 'N/A'}</span>
                      <span>👥 Total Votes: {totalVotes}</span>
                      <span>📅 Created: {new Date(poll.createdAt).toLocaleDateString('hi-IN')}</span>
                      <span>{poll.active ? '🟢 Active' : '⚪ Inactive'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Link
                      href={`/poll/${poll.id}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition"
                    >
                      View &rarr;
                    </Link>
                    <form action={deletePoll}>
                      <input type="hidden" name="pollId" value={poll.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition"
                      >
                        Delete Poll
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