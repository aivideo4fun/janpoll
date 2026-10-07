'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_AD_KEY = '088d090f5a0ddc02fefc698afbfd2ece';

type NativeBannerProps = {
  /** Ad network ke code me "/21/" ke baad wali key */
  adKey?: string;
  className?: string;
};

export default function NativeBanner({
  adKey = DEFAULT_AD_KEY,
  className = 'my-6 flex justify-center overflow-hidden',
}: NativeBannerProps) {
  const holderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    let loaded = false;

    const loadAd = () => {
      if (loaded) return;
      loaded = true;
      holder.innerHTML = '';

      const container = document.createElement('div');
      container.id = `container-${adKey}`;
      holder.appendChild(container);

      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = `https://bicea.org/21/${adKey}`;
      holder.appendChild(script);
    };

    // जब यूज़र स्क्रॉल करके विज्ञापन के पास पहुँचे तभी लोड हो
    if (typeof IntersectionObserver === 'undefined') {
      loadAd();
      return () => {
        holder.innerHTML = '';
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadAd();
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(holder);

    return () => {
      observer.disconnect();
      holder.innerHTML = '';
    };
  }, [adKey]);

  return <div ref={holderRef} className={className} />;
}