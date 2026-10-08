import Link from 'next/link';
import { handleLogin } from '../actions/adminActions';

export default function LoginScreen({ error }: { error?: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md px-4 sm:mt-20">
      <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-600 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl">
            🔐
          </div>
          <h1 className="text-2xl font-black">एडमिन पोर्टल</h1>
          <p className="mt-2 text-xs text-emerald-50">केवल अधिकृत प्रशासकों के लिए</p>
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
              <label htmlFor="username" className="mb-1.5 block text-xs font-bold text-gray-700">
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
              <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-gray-700">
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
              className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white shadow transition hover:bg-emerald-800"
            >
              लॉग इन करें
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5 text-center">
            <Link href="/" className="text-xs font-semibold text-emerald-700 hover:underline">
              ← होम पेज पर वापस जाएं
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}