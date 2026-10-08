import Link from 'next/link';

type AdminHeaderProps = {
  handleLogout: () => Promise<void>;
};

export default function AdminHeader({ handleLogout }: AdminHeaderProps) {
  return (
    <header className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 text-white shadow-lg p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-emerald-50">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          सुरक्षित प्रशासक क्षेत्र
        </div>
        <h1 className="text-2xl font-black sm:text-3xl">प्रशासक प्रबंधन डैशबोर्ड</h1>
        <p className="mt-2 text-xs text-emerald-100 sm:text-sm">
          सार्वजनिक पोल्स, मतों और उपयोगकर्ता संपर्क संदेशों की निगरानी एवं संचालन करें।
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
        >
          होम पेज →
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
    </header>
  );
}