import Link from 'next/link';

type AdminHeaderProps = {
  totalPolls: number;
  totalVotes: number;
  totalSubscribers: number;
  totalMessages: number;
  logoutAction: () => Promise<void>;
};

const nf = (n: number) => n.toLocaleString('en-IN');

export default function AdminHeader({
  totalPolls,
  totalVotes,
  totalSubscribers,
  totalMessages,
  logoutAction,
}: AdminHeaderProps) {
  const stats = [
    { icon: '📊', label: 'कुल पंजीकृत पोल', value: totalPolls },
    { icon: '🗳️', label: 'कुल प्राप्त मत', value: totalVotes },
    { icon: '✉️', label: 'संपर्क संदेश', value: totalMessages },
    { icon: '📧', label: 'न्यूज़लेटर सदस्य', value: totalSubscribers },
  ];

  return (
    <header className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="inline-block rounded-full border border-emerald-600 bg-emerald-700/70 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-100">
              सुरक्षित प्रशासक क्षेत्र
            </span>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">प्रशासन नियंत्रण कक्ष</h1>
            <p className="text-xs text-emerald-200/80">
              पोल, मत, संपर्क संदेश और न्यूज़लेटर सदस्यों का प्रबंधन एक ही स्थान से करें।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold transition hover:bg-white/20"
            >
              वेबसाइट देखें →
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-xs font-bold shadow-sm transition hover:bg-red-700"
              >
                लॉग आउट
              </button>
            </form>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 border-t border-emerald-700/60 pt-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-emerald-700/50 bg-emerald-950/40 p-4 text-center"
            >
              <p className="text-2xl font-black">{nf(s.value)}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-300">
                {s.icon} {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}