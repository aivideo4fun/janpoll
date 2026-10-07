'use client';

import { useEffect, useRef, useState } from 'react';

type AdsterraBannerProps = {
  adKey: string;
  width: number;
  height: number;
  /** Ad code ke <script src="..."> ka poora URL */
  src: string;
  className?: string;
};

export default function AdsterraBanner({
  adKey,
  width,
  height,
  src,
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

  // सिर्फ़ सुरक्षित key और https URL ही चलेंगे
  if (!/^[a-zA-Z0-9]+$/.test(adKey) || !/^https:\/\/[a-zA-Z0-9.-]+\/[a-zA-Z0-9/_.-]+$/.test(src)) {
    return null;
  }

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