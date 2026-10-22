'use client';
import { usePathname } from 'next/navigation';
import './adsterra.css';
const AD_HTML = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden}#ad-root{width:728px;height:90px;transform:scale(var(--ad-scale,1));transform-origin:top left}</style></head><body><div id="ad-root"><script>function fitAd(){document.documentElement.style.setProperty('--ad-scale',String(Math.min(1,innerWidth/728)))}fitAd();addEventListener('resize',fitAd);var atOptions={key:'284cee4d0f75c889cb2c8420f6c1834f',format:'iframe',height:90,width:728,params:{}};<\/script><script src="https://bicea.org/22/284cee4d0f75c889cb2c8420f6c1834f"><\/script></div></body></html>`;
/** Separate documents isolate publisher globals. Native iframe lazy loading needs no hydration. */
export default function Adsterra728({ placement, language = 'hi' }: { placement: 'home' | 'footer' | 'poll'; language?: 'hi' | 'en' }) {
  const pathname = usePathname();
  if (/^\/(admin|profile|my-polls|poll-created|create|api)(\/|$)/.test(pathname) || process.env.NEXT_PUBLIC_NETWORK_ADS_ENABLED === 'false') return null;
  return <aside className="jh-ad" aria-label={language==='en'?'Advertisement':'विज्ञापन'} data-ad-placement={placement}>
    <p>{language==='en'?'Advertisement':'विज्ञापन'}</p><div className="jh-ad-viewport">
      <iframe title={language==='en'?`Advertisement — ${placement}`:`विज्ञापन — ${placement === 'home' ? 'होमपेज' : placement === 'poll' ? 'पोल' : 'फुटर'}`} width="728" height="90" srcDoc={AD_HTML} loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  </aside>;
}
