'use client';

import { useEffect, useRef, useState } from 'react';

type AdsterraBannerProps = {
  adKey?: string;
  width?: number;
  height?: number;
  src?: string;
  className?: string;
};

export default function AdsterraBanner({
  adKey = '284cee4d0f75c889cb2c8420f6c1834f',
  width = 728,
  height = 90,
  src = 'https://bicea.org/22/284cee4d0f75c889cb2c8420f6c1834f',
  className,
}: AdsterraBannerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const srcDoc =
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style>' +
    '</head><body>' +
    `<script>atOptions={'key':'${adKey}','format':'iframe','height':${height},'width':${width},'params':{}};</script>` +
    `<script src="${src}"></script>` +
    '</body></html>';

  return (
    <div ref={wrapRef} className={className} style={{ minHeight: height }}>
      {visible && (
        <iframe
          title="विज्ञापन"
          srcDoc={srcDoc}
          width={width}
          height={height}
          scrolling="no"
          style={{ border: 0, maxWidth: '100%' }}
        />
      )}
    </div>
  );
}