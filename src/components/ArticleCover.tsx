'use client';
import { useState } from 'react';
export default function ArticleCover({src,alt}:{src?:string|null;alt:string}){
 const [failed,setFailed]=useState(false);
 return <div className="jp-article-cover">{src&&!failed?<img src={src} alt={alt} loading="lazy" decoding="async" onError={()=>setFailed(true)} className="h-full w-full object-cover"/>:<div className="flex h-full flex-col justify-between p-7 text-emerald-50"><span className="text-xs tracking-[.2em]">JANPOLL / PERSPECTIVES</span><span aria-hidden="true" className="text-6xl font-light text-emerald-300">“</span><span className="text-sm tracking-wide">Voice of People</span></div>}</div>;
}
