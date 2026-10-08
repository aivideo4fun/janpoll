'use client';

import { useEffect } from 'react';

export default function SocialBarAd() {
  useEffect(() => {
    const scriptId = 'adsterra-social-bar';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://bicea.org/14/c5ac7b06efdc19e1c0268c61cae2269f';
    script.async = true;

    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return null;
}