'use client';
import { useEffect, useRef } from 'react';

export default function NativeBanner() {
  const nativeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!nativeRef.current) return;
    nativeRef.current.innerHTML = '';

    const container = document.createElement('div');
    container.id = 'container-088d090f5a0ddc02fefc698afbfd2ece';
    nativeRef.current.appendChild(container);

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://bicea.org/21/088d090f5a0ddc02fefc698afbfd2ece';
    nativeRef.current.appendChild(script);
  }, []);

  return <div ref={nativeRef} className="my-6 flex justify-center overflow-hidden" />;
}