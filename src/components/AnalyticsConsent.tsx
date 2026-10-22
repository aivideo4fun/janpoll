'use client';
import { useEffect,useRef,useState } from 'react';
import { usePathname } from 'next/navigation';
const KEY='janpoll-analytics-choice';
export function AnalyticsSettingsButton(){return <button type="button" onClick={()=>window.dispatchEvent(new Event('janpoll-analytics-settings'))} className="min-h-11 text-xs text-emerald-300 underline">Analytics privacy settings</button>;}
export default function AnalyticsConsent(){
 const path=usePathname();const [choice,setChoice]=useState<string|null>('loading');const last=useRef('');const navigated=useRef(false);
 const privatePage=/^\/(admin|api|profile|my-polls|poll-created)(\/|$)/.test(path);
 useEffect(()=>{try{setChoice(localStorage.getItem(KEY));}catch{setChoice('no');}const reset=()=>setChoice(null);window.addEventListener('janpoll-analytics-settings',reset);return()=>window.removeEventListener('janpoll-analytics-settings',reset);},[]);
 useEffect(()=>{
  if(choice!=='yes'||privatePage||last.current===path)return;last.current=path;
  try {
   const saved=JSON.parse(sessionStorage.getItem('jp-analytics-session')||'null');const session=saved&&saved.expires>Date.now()?saved:{id:crypto.randomUUID(),expires:Date.now()+1800000};session.expires=Date.now()+1800000;sessionStorage.setItem('jp-analytics-session',JSON.stringify(session));
   let referrerHost=null;try{referrerHost=navigated.current?window.location.hostname:document.referrer?new URL(document.referrer).hostname:null;}catch{}navigated.current=true;
   void fetch('/api/analytics/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),sessionId:session.id,path,referrerHost,deviceType:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop',consent:true}),keepalive:true}).catch(()=>{});
  }catch{}
 },[path,choice,privatePage]);
 function choose(value:string){try{localStorage.setItem(KEY,value);if(value==='no')sessionStorage.removeItem('jp-analytics-session');}catch{}setChoice(value);}
 if(privatePage||choice!==null)return null;
 return <aside aria-label="Optional analytics" className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-white p-5 shadow-xl"><p className="text-sm leading-7 text-slate-700">Would you like to share optional site analytics? This helps us understand page and device usage. Your voting choice is not included.</p><div className="mt-3 flex gap-3"><button onClick={()=>choose('yes')} className="min-h-11 rounded-xl bg-emerald-800 px-5 text-sm text-white">Accept</button><button onClick={()=>choose('no')} className="min-h-11 rounded-xl border px-5 text-sm text-emerald-900">Not now</button></div></aside>;
}
