import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <header className="bg-white border-b border-emerald-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo aur Brand Name */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image 
            src="/logo.png" 
            alt="JanPoll Logo" 
            width={36} 
            height={36} 
            className="object-contain"
          />
          <span className="text-xl font-black tracking-tight text-emerald-900">
            JANPOLL
          </span>
        </Link>

        {/* Instagram Profile Link */}
        <div className="flex items-center gap-3">
          <a
            href="https://instagram.com/janpoll.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold rounded-xl border border-pink-200 transition shadow-sm"
          >
            <span>📸</span> Instagram
          </a>
        </div>

      </div>
    </header>
  );
}