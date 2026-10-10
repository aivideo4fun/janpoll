'use client';

import { useEffect, useRef, useState } from 'react';

const AD_KEY = '284cee4d0f75c889cb2c8420f6c1834f';
const AD_WIDTH = 728;
const AD_HEIGHT = 90;

export default function Ad728x90({ className = '' }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Adsterra का कोड (वही जो आपने दिया है) एक बार लोड करना
  useEffect(() => {
    const el = adRef.current;
    if (!el) return;
    el.innerHTML = '';

    const conf = document.createElement('script');
    conf.type = 'text/javascript';
    conf.text = `
      atOptions = {
        'key' : '${AD_KEY}',
        'format' : 'iframe',
        'height' : ${AD_HEIGHT},
        'width' : ${AD_WIDTH},
        'params' : {}
      };
    `;
    el.appendChild(conf);

    const invoke = document.createElement('script');
    invoke.type = 'text/javascript';
    invoke.src = `https://bicea.org/22/${AD_KEY}`;
    el.appendChild(invoke);

    return () => {
      el.innerHTML = '';
    };
  }, []);

  // छोटी स्क्रीन (मोबाइल) पर विज्ञापन को स्क्रीन की चौड़ाई में फिट करना
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / AD_WIDTH));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={`flex w-full justify-center overflow-hidden ${className}`}>
      <div style={{ width: AD_WIDTH * scale, height: AD_HEIGHT * scale }} className="overflow-hidden">
        <div
          ref={adRef}
          style={{
            width: AD_WIDTH,
            height: AD_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
    </div>
  );
}