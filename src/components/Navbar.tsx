import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black text-[#173F5F]">JANPOLL</span>
          <span className="text-xs bg-[#20639B] text-white px-2 py-0.5 rounded font-medium">राजस्थान</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-[#20639B]">
            होम
          </Link>
          <Link
            href="/create"
            className="bg-[#20639B] hover:bg-[#173F5F] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Create Poll
          </Link>
        </div>
      </div>
    </header>
  );
}