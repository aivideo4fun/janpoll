import Link from 'next/link';
import Image from 'next/image'; // 👈 Next.js ka Image component import karein

export default function Navbar() {
  return (
    <header className="bg-white border-b border-emerald-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo aur Brand Name */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image 
            src="/logo.png"         // 👈 public folder me rakhi hui file ka naam
            alt="JanPoll Logo" 
            width={36} 
            height={36} 
            className="object-contain"
          />
          <span className="text-xl font-black tracking-tight text-emerald-900">
            JANPOLL <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">राजस्थान</span>
          </span>
        </Link>

        {/* Baaki navigation links yahan hongi */}
      </div>
    </header>
  );
}