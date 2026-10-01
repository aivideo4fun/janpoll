import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Admin Login Server Action
async function handleLogin(formData: FormData) {
  'use server';
  const username = formData.get('username');
  const password = formData.get('password');

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    const cookieStore = await cookies();
    cookieStore.set('janpoll_admin_auth', 'authenticated_secure_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 din tak valid
      path: '/',
    });
  }
}

// Admin Logout Action
async function handleLogout() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('janpoll_admin_auth');
}

// Poll Delete Action
async function deletePoll(formData: FormData) {
  'use server';
  const cookieStore = await cookies();
  if (cookieStore.get('janpoll_admin_auth')?.value !== 'authenticated_secure_token') {
    return;
  }

  const pollId = formData.get('pollId') as string;
  if (pollId) {
    await db.poll.delete({ where: { id: pollId } });
    revalidatePath('/admin');
    revalidatePath('/');
  }
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthenticated =
    cookieStore.get('janpoll_admin_auth')?.value === 'authenticated_secure_token';

  // Agar login nahi hai toh Login Form dikhayein
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-emerald-100">
          <h1 className="text-2xl font-black text-emerald-900 mb-2 text-center">
            🔐 Admin Portal Login
          </h1>
          <p className="text-xs text-gray-500 mb-6 text-center">
            Yeh area sirf authorized admin ke liye hai.
          </p>

          <form action={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                name="username"
                required
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Admin username"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Admin password"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition shadow"
            >
              Login Karein
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-emerald-700 font-semibold underline">
              &larr; Home page par wapas jayein
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Agar login hai toh sabhi polls ki list aur delete feature dikhayein
  let polls: any[] = [];
  try {
    polls = await db.poll.findMany({
      include: { options: true, votes: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error loading admin polls:', error);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-gray-800">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
        <div>
          <h1 className="text-2xl font-black text-emerald-900">🛠 Admin Management Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">Yahan se aap kisi bhi apattijanak poll ko track aur delete kar sakte hain.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="px-3 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
            Home ↗
          </Link>
          <form action={handleLogout}>
            <button
              type="submit"
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 font-bold text-sm text-emerald-900 flex justify-between">
          <span>कुल रजिस्टर्ड पोल्स</span>
          <span>{polls.length}</span>
        </div>

        <div className="divide-y divide-emerald-100">
          {polls.length === 0 ? (
            <p className="p-8 text-center text-gray-500 text-sm">Koi poll available nahi hai.</p>
          ) : (
            polls.map((poll) => {
              const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt.voteCount, 0);
              return (
                <div key={poll.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-gray-900">{poll.question}</h3>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                      <span>👤 Name: {poll.creatorName || 'Anonymous'}</span>
                      <span>📧 Email: {poll.creatorEmail || 'N/A'}</span>
                      <span>🌐 IP: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">{poll.creatorIp || 'N/A'}</code></span>
                      <span>👥 Votes: {totalVotes}</span>
                      <span>📅 Date: {new Date(poll.createdAt).toLocaleDateString('hi-IN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Link
                      href={`/poll/${poll.id}`}
                      target="_blank"
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition"
                    >
                      Dekhein ↗
                    </Link>
                    <form action={deletePoll}>
                      <input type="hidden" name="pollId" value={poll.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition"
                      >
                        🗑️ Delete
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