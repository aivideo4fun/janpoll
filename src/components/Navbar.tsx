'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const socialRef = useRef<HTMLDivElement>(null);

  // ड्रॉपडाउन के बाहर क्लिक करने पर बंद करने के लिए
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (socialRef.current && !socialRef.current.contains(event.target as Node)) {
        setShowSocials(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-emerald-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* लोगो और ब्रांड नेम */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image 
            src="/logo.png" 
            alt="JanPoll Logo" 
            width={38} 
            height={38} 
            className="object-contain group-hover:scale-105 transition"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-tight text-emerald-900">
              JANPOLL
            </span>
            <span className="rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5">
              राजस्थान
            </span>
          </div>
        </Link>

        {/* राइट साइड: केवल सोशल मीडिया ड्रॉपडाउन (डेस्कटॉप) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative" ref={socialRef}>
            <button
              onClick={() => setShowSocials(!showSocials)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition shadow-sm focus:outline-none"
            >
              <span>🌐</span> हमसे जुड़ें ▾
            </button>

            {showSocials && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-emerald-100 p-2 z-50 space-y-1 animate-fadeIn">
                <a
                  href="https://instagram.com/janpoll.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-pink-50 hover:text-pink-700 transition"
                >
                  <Image src="/images/instagram.png" alt="Instagram" width={20} height={20} className="object-contain" />
                  <span>इंस्टाग्राम</span>
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61595121995283"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <Image src="/images/facebook.png" alt="Facebook" width={20} height={20} className="object-contain" />
                  <span>फेसबुक</span>
                </a>
                <a
                  href="https://twitter.com/janpollindia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-black transition"
                >
                  <Image src="/images/x.png" alt="X" width={20} height={20} className="object-contain" />
                  <span>X (ट्विटर)</span>
                </a>
                <a
                  href="https://youtube.com/shorts/f7N05oSyfXc?feature=shared"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-700 transition"
                >
                  <Image src="/images/youtube.png" alt="YouTube" width={20} height={20} className="object-contain" />
                  <span>यूट्यूब</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* मोबाइल सोशल मीडिया बटन */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 hover:bg-emerald-100 transition focus:outline-none flex items-center gap-1.5 text-xs font-bold shadow-sm"
            aria-label="सोशल मीडिया मेनू"
          >
            <span>🌐</span> हमसे जुड़ें
          </button>
        </div>

      </div>

      {/* मोबाइल ड्रॉपडाउन मेनू */}
      {isOpen && (
        <div className="md:hidden border-t border-emerald-100 bg-white px-4 py-4 shadow-lg space-y-2">
          <p className="text-xs font-bold text-gray-400 mb-1">सोशल मीडिया पर फॉलो करें:</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://instagram.com/janpoll.in"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 p-2.5 bg-pink-50 text-pink-700 text-xs font-bold rounded-xl border border-pink-200 justify-center"
            >
              <Image src="/images/instagram.png" alt="Instagram" width={18} height={18} className="object-contain" />
              <span>इंस्टाग्राम</span>
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61595121995283"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 p-2.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 justify-center"
            >
              <Image src="/images/facebook.png" alt="Facebook" width={18} height={18} className="object-contain" />
              <span>फेसबुक</span>
            </a>
            <a
              href="https://twitter.com/janpollindia"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 p-2.5 bg-gray-50 text-black text-xs font-bold rounded-xl border border-gray-200 justify-center"
            >
              <Image src="/images/x.png" alt="X" width={18} height={18} className="object-contain" />
              <span>X (ट्विटर)</span>
            </a>
            <a
              href="https://youtube.com/shorts/f7N05oSyfXc?feature=shared"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 justify-center"
            >
              <Image src="/images/youtube.png" alt="YouTube" width={18} height={18} className="object-contain" />
              <span>यूट्यूब</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}