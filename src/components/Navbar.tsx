'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { getRegionBySlug } from '@/lib/regions';

const SOCIALS = [
  { name: 'Telegram', href: 'https://t.me/janpollindia', icon: '/images/telegram.svg' },
  {
    name: 'WhatsApp चैनल',
    href: 'https://whatsapp.com/channel/0029VbEDUaJ5Ui2OzmpEYI3D',
    icon: '/images/whatsapp.png',
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/janpoll.in',
    icon: '/images/instagram.png',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61595121995283',
    icon: '/images/facebook.png',
  },
  {
    name: 'X / Twitter',
    href: 'https://twitter.com/janpollindia',
    icon: '/images/x.png',
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const segments = pathname.split('/').filter(Boolean);

  const region = getRegionBySlug(
    segments[0] === 'state' || segments[0] === 'states'
      ? segments[1]
      : segments[0],
  );

  const createHref = region
    ? `/create?state=${encodeURIComponent(region.slug)}`
    : '/create';

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutside = (event: PointerEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        {/* Logo, brand name and tagline */}
        <Link
          href="/"
          aria-label="JanPoll — Voice of People — Home"
          className="group inline-flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 sm:gap-3"
        >
          <Image
            src="/logo.png"
            alt=""
            width={72}
            height={72}
            priority
            sizes="(max-width: 639px) 56px, 72px"
            className="h-14 w-14 shrink-0 object-contain transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none sm:h-[72px] sm:w-[72px]"
          />

          <span className="inline-flex min-w-0 flex-col items-start justify-center">
            <span
              className="whitespace-nowrap text-[25px] font-extrabold leading-none tracking-[0.015em] text-[#064E3B] sm:text-[30px]"
              style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              JANPOLL
            </span>

            <span
              className="mt-2 whitespace-nowrap text-[9px] font-semibold leading-none tracking-[0.18em] text-emerald-700 sm:text-[10px]"
              style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              Voice of People
            </span>
          </span>
        </Link>

        {/* Only the menu button remains outside */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={isOpen ? 'मेनू बंद करें' : 'मेनू खोलें'}
            aria-expanded={isOpen}
            aria-controls="janpoll-main-menu"
            onClick={() => setIsOpen((current) => !current)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-900 transition-colors hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 sm:h-[52px] sm:w-[52px]"
          >
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {isOpen ? (
                <path d="m6 6 12 12M18 6 6 18" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {isOpen && (
            <nav
              id="janpoll-main-menu"
              aria-label="मुख्य नेविगेशन"
              className="absolute right-0 top-full mt-3 max-h-[70dvh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-2xl border border-emerald-100 bg-white p-3 shadow-xl shadow-emerald-950/10"
            >
              <p className="px-3 py-2 font-sans text-[10px] font-semibold tracking-[0.16em] text-slate-400">
                EXPLORE JANPOLL
              </p>

              {[
                { href: '/', label: 'होम' },
                { href: '/states', label: 'पोल देखें' },
                { href: createHref, label: '＋ पोल बनाएँ' },
                { href: '/my-polls', label: 'मेरे पोल / Reference IDs' },
                { href: '/articles', label: 'लेख और विश्लेषण' },
                { href: '/profile', label: 'मेरी प्रोफाइल / Login' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex min-h-12 items-center rounded-xl px-3 py-2 text-sm font-medium leading-7 text-emerald-950 transition-colors hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                >
                  {item.label}
                </Link>
              ))}

              <div className="my-3 border-t border-slate-100" />

              <p className="px-3 py-2 text-xs font-medium leading-7 text-slate-400">
                हमसे जुड़ें
              </p>

              {SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-sm leading-7 text-slate-600 transition-colors hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                >
                  <Image
                    src={social.icon}
                    alt=""
                    width={20}
                    height={20}
                    className="shrink-0 object-contain"
                  />

                  <span>{social.name}</span>
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}