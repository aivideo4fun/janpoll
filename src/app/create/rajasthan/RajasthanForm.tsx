'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

type Item = { id: string; nameHi: string; wardNo?: number };
type Initial = { districtId: string; samitiId: string; gpId: string; zilaWardId: string; samitiWardId: string; type: string };
const field = 'mt-2 min-h-12 w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm leading-7';
function LocationSelect({ label, value, items, onChange }: { label: string; value: string; items: Item[]; onChange: (value: string) => void }) {
  return <label className="block text-sm leading-7 text-slate-700">{label}<select required value={value} onChange={e => onChange(e.target.value)} className={field}><option value="">चुनें</option>{items.map(item => <option key={item.id} value={item.id}>{item.wardNo ? `वार्ड ${item.wardNo} · ` : ''}{item.nameHi}</option>)}</select></label>;
}
export default function RajasthanForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [type, setType] = useState(initial.type);
  const [district, setDistrict] = useState(initial.districtId);
  const [samiti, setSamiti] = useState(initial.samitiId);
  const [gp, setGp] = useState(initial.gpId);
  const [ward, setWard] = useState(initial.samitiWardId);
  const [zila, setZila] = useState(initial.zilaWardId);
  const [districts, setDistricts] = useState<Item[]>([]);
  const [tehsils, setTehsils] = useState<Item[]>([]);
  const [tehsil, setTehsil] = useState('');
  const [samitis, setSamitis] = useState<Item[]>([]);
  const [children, setChildren] = useState<Item[]>([]);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [days, setDays] = useState(3);
  const [login, setLogin] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/locations/election?stateCode=RJ&kind=district', { signal: controller.signal })
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.message); return data; })
      .then(data => setDistricts(data.items || []))
      .catch(e => { if (e.name !== 'AbortError') setError('जिले लोड नहीं हो सके।'); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!district) return;
    const controller = new AbortController();
    fetch(`/api/locations/election?stateCode=RJ&kind=tehsil&districtId=${encodeURIComponent(district)}`, { signal: controller.signal }).then(r => r.json()).then(data => setTehsils(data.items || [])).catch(() => {});
    const kind = type === 'zila' ? 'zilaWard' : 'samiti';
    fetch(`/api/locations/election?stateCode=RJ&kind=${kind}&districtId=${encodeURIComponent(district)}`, { signal: controller.signal })
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.message); return data; })
      .then(data => type === 'zila' ? setChildren(data.items || []) : setSamitis(data.items || []))
      .catch(e => { if (e.name !== 'AbortError') setError('क्षेत्र लोड नहीं हो सके।'); });
    return () => controller.abort();
  }, [district, type]);
  useEffect(() => {
    if (!district || !samiti || type === 'zila') return;
    const controller = new AbortController();
    fetch(`/api/locations/election?stateCode=RJ&kind=${type === 'sarpanch' ? 'gp' : 'samitiWard'}&districtId=${encodeURIComponent(district)}&samitiId=${encodeURIComponent(samiti)}`, { signal: controller.signal })
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.message); return data; })
      .then(data => setChildren(data.items || []))
      .catch(e => { if (e.name !== 'AbortError') setError('पंचायत/वार्ड लोड नहीं हो सके।'); });
    return () => controller.abort();
  }, [district, samiti, type]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    if (status !== 'authenticated') { setError('पोल बनाने के लिए Google से sign-in करें।'); return; }
    setError(''); setBusy(true);
    try {
      const response = await fetch('/api/polls/rajasthan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        question: question.trim(), options: options.map(value => value.trim()), electionType: type,
        districtId: district, samitiId: type === 'zila' ? null : samiti,
        gramPanchayatId: type === 'sarpanch' ? gp : null,
        samitiWardId: type === 'samiti' ? ward : null,
        zilaWardId: type === 'zila' ? zila : null,
        deadlineDays: days, requiresLogin: login, termsAgreed: terms,
      }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'पोल प्रकाशित नहीं हुआ।');
      router.push(`/poll-created/${data.pollId}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'दोबारा प्रयास करें।'); setBusy(false); }
  }
  return <main lang="hi" className="min-h-screen bg-slate-50 px-4 py-8"><section className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-9">
    <Link href="/rajasthan" className="text-sm text-emerald-800">← राजस्थान</Link>
    <h1 className="mt-5 text-2xl font-semibold leading-relaxed text-emerald-950 sm:text-3xl">नया ओपिनियन पोल बनाएँ</h1><p className="mt-2 text-sm leading-7 text-slate-500">राजस्थान · अपने क्षेत्र की राय जानें। यह आधिकारिक जनमत मतदान नहीं है।</p>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm leading-7 text-red-800">{error}</p>}
    {!session && <div className="mt-6 rounded-2xl bg-emerald-50 p-5"><p className="text-sm leading-7">पोल बनाने के लिए Google से sign-in करें। नाम/email केवल admin को उपलब्ध होगा। Voting का तरीका आप अलग चुनेंगे।</p><button onClick={() => signIn('google', { callbackUrl: window.location.href })} className="mt-3 rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm">Continue with Google</button></div>}
    <form onSubmit={submit} className="mt-6"><fieldset disabled={busy || status !== 'authenticated'} className="space-y-6">
      <label className="block text-sm">पोल का प्रकार<select value={type} onChange={e => { setType(e.target.value); setGp(''); setWard(''); setZila(''); setChildren([]); }} className={field}><option value="sarpanch">सरपंच जनमत</option><option value="samiti">पंचायत समिति वार्ड</option><option value="zila">जिला परिषद वार्ड</option></select></label>
      <div className="grid gap-4 sm:grid-cols-2"><LocationSelect label="जिला" value={district} items={districts} onChange={value => { setDistrict(value); setTehsil(''); setTehsils([]); setSamiti(''); setGp(''); setWard(''); setZila(''); setSamitis([]); setChildren([]); }} />
      {type !== 'zila' && tehsils.length > 0 && <label className="block text-sm leading-7">तहसील (वैकल्पिक)<select value={tehsil} onChange={e => setTehsil(e.target.value)} className={field}><option value="">सभी तहसीलें</option>{tehsils.map(item => <option key={item.id} value={item.id}>{item.nameHi}</option>)}</select><span className="text-xs text-slate-500">पंचायत समितियाँ जिले के अनुसार दिखाई गई हैं।</span></label>}
      {type !== 'zila' && <LocationSelect label="पंचायत समिति" value={samiti} items={samitis} onChange={value => { setSamiti(value); setGp(''); setWard(''); setChildren([]); }} />}
      <LocationSelect label={type === 'sarpanch' ? 'ग्राम पंचायत' : type === 'samiti' ? 'समिति वार्ड' : 'जिला परिषद वार्ड'} value={type === 'sarpanch' ? gp : type === 'samiti' ? ward : zila} items={children} onChange={type === 'sarpanch' ? setGp : type === 'samiti' ? setWard : setZila} /></div>
      <label className="block text-sm">आपका सवाल<textarea required minLength={5} maxLength={500} value={question} onChange={e => setQuestion(e.target.value)} className={field} rows={3} /></label>
      <fieldset><legend className="text-sm">विकल्प</legend>{options.map((value, index) => <div key={index} className="flex items-center gap-2"><input aria-label={`विकल्प ${index + 1}`} required maxLength={255} value={value} onChange={e => setOptions(options.map((old, i) => i === index ? e.target.value : old))} className={field} />{options.length > 2 && <button type="button" aria-label={`विकल्प ${index + 1} हटाएँ`} onClick={() => setOptions(options.filter((_, i) => i !== index))} className="min-h-11 px-3">×</button>}</div>)}{options.length < 15 && <button type="button" onClick={() => setOptions([...options, ''])} className="mt-3 min-h-11 text-sm text-emerald-800">＋ विकल्प जोड़ें</button>}</fieldset>
      <label className="block text-sm">अवधि (दिन)<input type="number" required min={1} max={60} value={days} onChange={e => setDays(Number(e.target.value))} className={field} /></label>
      <label className="flex items-start gap-3 text-sm leading-7"><input type="checkbox" checked={login} onChange={e => setLogin(e.target.checked)} className="mt-2 h-4 w-4" />वोट देने के लिए sign-in आवश्यक रखें। इसे बंद रखने पर लोग बिना login वोट दे सकते हैं।</label>
      <label className="flex items-start gap-3 text-sm leading-7"><input required type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-2 h-4 w-4" /><span>मैं JanPoll के <Link href="/terms" target="_blank" className="text-emerald-800 underline">नियम और शर्तों</Link> से सहमत हूँ।</span></label>
      <button disabled={busy} className="min-h-12 w-full rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'प्रकाशित हो रहा है…' : 'पोल प्रकाशित करें'}</button><p className="text-xs leading-6 text-slate-500">Verified badge केवल admin review के बाद मिलता है।</p>
    </fieldset></form>
    <aside className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-8" aria-label="स्थान का डेटा नहीं मिला?">
      <strong>आपके क्षेत्र का डेटा नहीं मिला?</strong> अगर आपकी पंचायत, मंडल / पंचायत समिति या जिला परिषद का डेटा सूची में नहीं है, तो जिले और क्षेत्र के नाम के साथ <a href="mailto:support@janpoll.in" className="break-all font-semibold text-emerald-800 underline">support@janpoll.in</a> पर संपर्क करें।
    </aside>
  </section></main>;
}
