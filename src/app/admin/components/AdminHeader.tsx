'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AdminHeaderProps = {
  totalPolls: number;
  totalVotes: number;
  totalSubscribers: number;
};

export default function AdminHeader({ totalPolls, totalVotes, totalSubscribers }: AdminHeaderProps) {
  const router = useRouter();

  const handleClientLogout = async () => {
    try {
      // Cookie delete karne ke liye fetch call ya direct redirect
      document.cookie = 'admin_session=; Max-Age=0; path=/;';
      router.push('/admin');
      router.refresh();
    } catch (e) {
      window.location.href = '/admin';
    }
  };

  return (
    <header className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="space-y-1 text-center md:text-left">
            <span className="bg-emerald-700 text-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-600">
              सुरक्षित प्रशासक क्षेत्र
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              प्रशासक प्रबंधन डैशबोर्ड
            </h1>
            <p className="text-xs text-emerald-200/80">
              सार्वजनिक पोल्स, मतों और उपयोगकर्ता संपर्क संदेशों की निगरानी एवं संचालन करें।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs transition border border-white/20 shadow-sm"
            >
              होम पेज →
            </Link>

            <button
              onClick={handleClientLogout}
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              लॉग आउट
            </button>
          </div>

        </div>

        {/* Live Statistics Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-emerald-700/60">
          <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{totalPolls.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-300 font-semibold mt-1">📊 कुल पंजीकृत पोल्स</p>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{totalVotes.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-300 font-semibold mt-1">🗳️ कुल प्राप्त मत</p>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{totalSubscribers.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-300 font-semibold mt-1">📧 कुल न्यूज़लेटर सब्सक्राइबर</p>
          </div>
        </div>

      </div>
    </header>
  );
}