'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';

type SmartBackLinkProps = {
  fallbackHref?: string;
  className?: string;
  children: ReactNode;
};

export default function SmartBackLink({ fallbackHref = '/', className, children }: SmartBackLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    // Chrome: navigation.canGoBack सिर्फ़ इसी साइट के पिछले पेज को गिनता है।
    // बाकी ब्राउज़र: history.length > 1 (यानी पीछे कोई पेज है)।
    const nav = (window as unknown as { navigation?: { canGoBack?: boolean } }).navigation;
    const canGoBack =
      typeof nav?.canGoBack === 'boolean' ? nav.canGoBack : window.history.length > 1;

    if (canGoBack) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Link href={fallbackHref} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
