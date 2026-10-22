'use client';
import { useState } from 'react';
import Link from 'next/link';
import { REGIONS } from '@/lib/regions';
import StateArt from './StateArt';

export default function StateDirectory({ query = '', votes = {} }: { query?: string; votes?: Record<string, number> | null }) {
  const [expanded, setExpanded] = useState(false);
  const normalized = query.trim().toLowerCase();
  const states = REGIONS.filter(region => region.type === 'STATE' && region.code !== 'RJ').sort((a,b) => {
    return (votes?.[b.code] || 0) - (votes?.[a.code] || 0) || a.en.localeCompare(b.en);
  });
  const matches = (name: string, en: string, code: string) => !normalized || `${name} ${en} ${code}`.toLowerCase().includes(normalized);
  const filtered = states.filter(r => matches(r.name, r.en, r.code));
  const shown = expanded || normalized ? filtered : filtered.slice(0,6);
  const uts = REGIONS.filter(region => region.type === 'UT' && matches(region.name, region.en, region.code)).sort((a,b)=>(votes?.[b.code]||0)-(votes?.[a.code]||0)||a.en.localeCompare(b.en));
  return <section className="jh-panel" aria-labelledby="jh-states-title"><div className="jh-section-head"><h2 id="jh-states-title">अन्य राज्यों के पोल</h2><a className="jh-text-link" href="#jh-states-title" onClick={e => { e.preventDefault(); setExpanded(!expanded); }}>{expanded ? 'कम दिखाएँ ↑' : 'सभी राज्य देखें →'}</a></div>
    <div className="jh-state-grid">{shown.map(region => <Link href={`/explore/${region.slug}`} className="jh-state-card" key={region.code}><span className="jh-state-arrow" aria-hidden="true">↗</span><StateArt code={region.code} /><h3>{region.name}</h3><span className="jh-state-votes">{votes===null?'वोट उपलब्ध नहीं':`${(votes[region.code] || 0).toLocaleString('en-IN')} वोट`}</span></Link>)}</div>
    {!shown.length && <p className="jh-empty">इस खोज से कोई अन्य राज्य नहीं मिला।</p>}
    {!expanded && !normalized && <button type="button" className="jh-more" onClick={() => setExpanded(true)}>सभी 28 राज्य और केंद्र शासित प्रदेश देखें ↓</button>}
    {(expanded || normalized) && <div className="jh-ut-list" aria-label="केंद्र शासित प्रदेश">{uts.map(region => <Link href={`/explore/${region.slug}`} key={region.code}>{region.name} ↗</Link>)}</div>}
  </section>;
}
