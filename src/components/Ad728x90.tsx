'use client';
import { useEffect,useRef } from 'react';
import Script from 'next/script';
import NativeBanner from './NativeBanner';
import { usePathname } from 'next/navigation';
// Existing publisher native placement. No pop-under or automatic redirect tags.
export default function Ad728x90({className='',placement='content'}:{className?:string;placement?:'content'|'footer'}){
 const path=usePathname();
 const privatePage=/^\/(admin|profile|my-polls|poll-created|create|api)(\/|$)/.test(path);
 const ref=useRef<HTMLModElement>(null);const pushed=useRef(false);
 const client=process.env.NEXT_PUBLIC_ADSENSE_CLIENT||'';const slot=process.env.NEXT_PUBLIC_ADSENSE_SLOT||'';
 const networkEnabled=!privatePage&&process.env.NEXT_PUBLIC_NETWORK_ADS_ENABLED!=='false';
 const enabled=!privatePage&&process.env.NEXT_PUBLIC_ADS_ENABLED==='true'&&/^ca-pub-\d+$/.test(client)&&/^\d+$/.test(slot);
 useEffect(()=>{if(!enabled||pushed.current||!ref.current)return;const win=window as typeof window&{adsbygoogle?:unknown[]};try{(win.adsbygoogle=win.adsbygoogle||[]).push({});pushed.current=true;}catch{}},[enabled]);
 if(privatePage||(placement==='footer'&&/^\/poll(\/|$)/.test(path)))return null;
 return <aside aria-label="विज्ञापन" className={`my-6 rounded-2xl border border-slate-100 bg-white p-4 text-center ${className}`}><p className="mb-3 text-[10px] uppercase tracking-widest text-slate-400">विज्ञापन / Advertisement</p>{enabled?<><Script id="janpoll-adsense" strategy="afterInteractive" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} crossOrigin="anonymous"/><ins ref={ref} className="adsbygoogle" style={{display:'block',minHeight:90}} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"/></>:networkEnabled?<NativeBanner className="mx-auto w-full overflow-hidden"/>:<a href="/advertise" className="inline-flex min-h-16 items-center text-xs leading-7 text-slate-400">JanPoll पर विज्ञापन के लिए संपर्क करें →</a>}</aside>;
}
