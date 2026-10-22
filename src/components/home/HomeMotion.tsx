'use client';
import { useEffect } from 'react';
/** Content stays visible without JS. Motion runs once and never loops. */
export default function HomeMotion() {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (typeof entry.target.animate === 'function') animations.push(entry.target.animate([{opacity:.7,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}], {duration:280,easing:'ease-out'}));
        observer.unobserve(entry.target);
      });
    }, {threshold:.08});
    document.querySelectorAll('.jh-home .jh-panel').forEach(node => observer.observe(node));
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); };
  }, []);
  return null;
}
