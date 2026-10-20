'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
type Item = {id:string;title:string;body:string;href:string|null;tickerSpeed:number};
export default function AnnouncementTicker({items}:{items:Item[]}) {
 const path=usePathname();const [paused,setPaused]=useState(false);
 if(!items.length||/^\/(admin|api|profile|my-polls|poll-created)(\/|$)/.test(path))return null;
 const duration=Math.max(15,Math.min(120,items[0].tickerSpeed));
 const content=items.map(item=><span key={item.id} className="jp-ticker-item"><span aria-hidden="true" className="text-emerald-300">●</span>{item.href?<a href={item.href} onClick={()=>setPaused(true)} className="rounded px-1 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2">{item.title} — {item.body}</a>:<span>{item.title} — {item.body}</span>}</span>);
 return <section aria-label="JanPoll announcements" className="jp-ticker" data-paused={paused}>
  <span className="jp-ticker-label">JANPOLL UPDATES</span>
  <div className="jp-ticker-window" onClick={()=>setPaused(true)}><div className="jp-ticker-track" style={{animationDuration:`${duration}s`}}><div className="jp-ticker-group">{content}</div><div aria-hidden="true" className="jp-ticker-group jp-ticker-copy">{items.map(item=><span key={item.id} className="jp-ticker-item">● {item.title} — {item.body}</span>)}</div></div></div>
  <button type="button" aria-pressed={paused} onClick={()=>setPaused(!paused)} className="jp-ticker-toggle" aria-label={paused?'Resume announcements':'Pause announcements'}>{paused?'▶':'Ⅱ'}</button>
 </section>;
}
