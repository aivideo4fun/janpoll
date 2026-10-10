'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import SmartBackLink from '@/components/SmartBackLink';

export const dynamic = 'force-dynamic';

type LocItem = { id: string; nameHi: string; wardNo?: number };

const selectClass =
  'w-full px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm';

function CreatePollContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [electionType, setElectionType] = useState<'sarpanch' | 'samiti' | 'zila'>('sarpanch');
  const [question, setQuestion] = useState('');
  
  // Calendar Expiry Date (Max 60 Days limit)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = maxDate.toISOString().split('T')[0];
  const minDateStr = new Date().toISOString().split('T')[0];
  const [expiryDate, setExpiryDate] = useState(minDateStr);

  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Locations state
  const [districts, setDistricts] = useState<LocItem[]>([]);
  const [samitis, setSamitis] = useState<LocItem[]>([]);
  const [zilaWards, setZilaWards] = useState<LocItem[]>([]);
  const [samitiWards, setSamitiWards] = useState<LocItem[]>([]);
  const [villages, setVillages] = useState<LocItem[]>([]);
  const [gps, setGps] = useState<LocItem[]>([]);

  const [pickDistrictId, setPickDistrictId] = useState('');
  const [pickSamitiId, setPickSamitiId] = useState('');
  const [pickZilaWardId, setPickZilaWardId] = useState('');
  const [pickSamitiWardId, setPickSamitiWardId] = useState('');
  const [pickVillageId, setPickVillageId] = useState('');
  const [pickGpId, setPickGpId] = useState('');

  // जिलों की सूची लोड करना
  useEffect(() => {
    fetch('/api/locations')
      .then((r) => r.json())
      .then((d) => setDistricts(d.items ?? []))
      .catch(() => {});
  }, []);

  // जिला बदलने पर पंचायत समितियाँ और जिला परिषद वार्ड लोड करना
  useEffect(() => {
    setPickSamitiId('');
    setSamitis([]);
    setPickZilaWardId('');
    setZilaWards([]);

    if (!pickDistrictId) return;

    if (electionType === 'zila') {
      fetch(`/api/admin/locations?districtId=${pickDistrictId}`)
        .then((r) => r.json())
        .then((d) => {
          // Zila wards load (Agar zilaWards api ho ya general fetch)
          setZilaWards(d.items ?? []);
        })
        .catch(() => {});
    } else {
      fetch(`/api/admin/locations?districtId=${pickDistrictId}`)
        .then((r) => r.json())
        .then((d) => setSamitis(d.items ?? []))
        .catch(() => {});
    }
  }, [pickDistrictId, electionType]);

  // समिति बदलने पर वार्ड और ग्राम पंचायतें लोड करना
  useEffect(() => {
    setPickSamitiWardId('');
    setSamitiWards([]);
    setPickGpId('');
    setGps([]);
    if (!pickSamitiId || electionType !== 'samiti') return;

    fetch(`/api/admin/locations?samitiId=${pickSamitiId}`)
      .then((r) => r.json())
      .then((d) => setSamitiWards(d.items ?? []))
      .catch(() => {});

    fetch(`/api/locations?samitiId=${pickSamitiId}`)
      .then((r) => r.json())
      .then((d) => setGps(d.items ?? []))
      .catch(() => {});
  }, [pickSamitiId, electionType]);

  // वार्ड बदलने पर गाँव लोड करना
  useEffect(() => {
    setPickVillageId('');
    setVillages([]);
    const targetWardId = electionType === 'zila' ? pickZilaWardId : pickSamitiWardId;
    if (!targetWardId) return;

    fetch(`/api/admin/locations?wardId=${targetWardId}`)
      .then((r) => r.json())
      .then((d) => setVillages(d.items ?? []))
      .catch(() => {});
  }, [pickZilaWardId, pickSamitiWardId, electionType]);

  const handleAddOption = () => {
    if (options.length < 15) setOptions([...options, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!session) {
      setError('Kripya pehle Google se sign-in karein.');
      return;
    }
    if (!question.trim()) {
      setError('Kripya prashn darj karein.');
      return;
    }
    const validOptions = options.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Kam se kam 2 vikalp darj karna anivary hai.');
      return;
    }

    const targetTime = new Date(expiryDate).getTime();
    const diffDays = Math.ceil((targetTime - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 1 || diffDays > 60) {
      setError('Samyavadhi aaj se 1 se 60 din ke beech honi chahiye.');
      return;
    }

    const selDistrict = districts.find((d) => d.id === pickDistrictId)?.nameHi || null;
    const selSamiti = samitis.find((s) => s.id === pickSamitiId)?.nameHi || null;
    const selWard = electionType === 'zila' 
      ? zilaWards.find((w) => w.id === pickZilaWardId)?.nameHi || null
      : samitiWards.find((w) => w.id === pickSamitiWardId)?.nameHi || null;
    const selVillage = villages.find((v) => v.id === pickVillageId)?.nameHi || null;
    const selGp = gps.find((g) => g.id === pickGpId)?.nameHi || null;

    setLoading(true);

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          deadlineDays: diffDays,
          options: validOptions,
          districtName: selDistrict,
          samitiName: selSamiti,
          gramPanchayatName: electionType === 'sarpanch' ? selGp : selVillage,
          wardName: selWard,
          electionType,
          creatorName: session.user?.name || null,
          creatorEmail: session.user?.email || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Truti hui');

      router.push(`/poll/${data.pollId}`);
    } catch (err: any) {
      setError(err.message || 'Truti hui');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
      <div className="bg-white rounded-3xl shadow-md border border-emerald-100 p-8 md:p-10">
        <div className="mb-6 border-b border-emerald-100 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-emerald-900">नया ओपिनियन पोल बनाएँ</h1>
            <p className="text-xs text-slate-500 mt-1">अपने क्षेत्र और चुनाव श्रेणी के अनुसार नया पोल प्रकाशित करें।</p>
          </div>
          <SmartBackLink fallbackHref="/" className="text-xs text-emerald-700 font-bold underline">
            &larr; वापस जाएं
          </SmartBackLink>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{error}</div>}

        {!session ? (
          <div className="text-center py-12 space-y-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 p-8">
            <span className="text-4xl">🔐</span>
            <h3 className="font-bold text-gray-900 text-base">गूगल पहचान सत्यापन आवश्यक है</h3>
            <button
              onClick={() => signIn('google')}
              className="px-6 py-3 bg-emerald-700 text-white font-bold rounded-xl text-sm shadow hover:bg-emerald-800 transition"
            >
              🌐 गूगल के साथ साइन इन करें
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* चुनाव श्रेणी चयन */}
            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">चुनाव श्रेणी चुनें:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setElectionType('sarpanch'); setPickSamitiId(''); setPickZilaWardId(''); }}
                  className={`p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    electionType === 'sarpanch' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🟢 सरपंच चुनाव
                </button>
                <button
                  type="button"
                  onClick={() => { setElectionType('samiti'); setPickSamitiId(''); setPickZilaWardId(''); }}
                  className={`p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    electionType === 'samiti' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🔵 पंचायत समिति वार्ड
                </button>
                <button
                  type="button"
                  onClick={() => { setElectionType('zila'); setPickSamitiId(''); setPickZilaWardId(''); }}
                  className={`p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    electionType === 'zila' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🟠 जिला परिषद वार्ड
                </button>
              </div>
            </div>

            {/* स्थान चयन */}
            <div className="space-y-3 p-5 bg-emerald-50/40 rounded-2xl border border-emerald-200">
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">📍 स्थान विवरण (Location)</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={pickDistrictId}
                  onChange={(e) => { setPickDistrictId(e.target.value); setPickSamitiId(''); setPickZilaWardId(''); }}
                  className={selectClass}
                >
                  <option value="">जिला चुनें</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.nameHi}</option>)}
                </select>

                {/* Sarpanch & Samiti ke liye Panchayat Samiti aayegi, Zila ke liye sidha Zila Ward aayega */}
                {electionType !== 'zila' ? (
                  <select
                    value={pickSamitiId}
                    onChange={(e) => setPickSamitiId(e.target.value)}
                    disabled={!pickDistrictId}
                    className={selectClass}
                  >
                    <option value="">पंचायत समिति चुनें</option>
                    {samitis.map((s) => <option key={s.id} value={s.id}>{s.nameHi}</option>)}
                  </select>
                ) : (
                  <select
                    value={pickZilaWardId}
                    onChange={(e) => setPickZilaWardId(e.target.value)}
                    disabled={!pickDistrictId}
                    className={selectClass}
                  >
                    <option value="">जिला परिषद वार्ड चुनें</option>
                    {zilaWards.map((w) => <option key={w.id} value={w.id}>{w.nameHi}</option>)}
                  </select>
                )}

                {electionType === 'sarpanch' && (
                  <select
                    value={pickGpId}
                    onChange={(e) => setPickGpId(e.target.value)}
                    disabled={!pickSamitiId}
                    className={`${selectClass} sm:col-span-2`}
                  >
                    <option value="">ग्राम पंचायत चुनें</option>
                    {gps.map((g) => <option key={g.id} value={g.id}>{g.nameHi}</option>)}
                  </select>
                )}

                {electionType === 'samiti' && (
                  <>
                    <select
                      value={pickSamitiWardId}
                      onChange={(e) => setPickSamitiWardId(e.target.value)}
                      disabled={!pickSamitiId}
                      className={selectClass}
                    >
                      <option value="">वार्ड चुनें</option>
                      {samitiWards.map((w) => <option key={w.id} value={w.id}>{w.nameHi}</option>)}
                    </select>

                    <select
                      value={pickVillageId}
                      onChange={(e) => setPickVillageId(e.target.value)}
                      disabled={!pickSamitiWardId}
                      className={selectClass}
                    >
                      <option value="">गाँव / क्षेत्र चुनें</option>
                      {villages.map((v) => <option key={v.id} value={v.id}>{v.nameHi}</option>)}
                    </select>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">पोल का प्रश्न (Question) *</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="यहाँ अपना प्रश्न स्पष्ट शब्दों में लिखें..."
                rows={3}
                required
                className="w-full p-4 rounded-xl border border-emerald-200 text-sm bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* कैलैंडर एक्सपायरी डेट */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                ⏳ पोल समाप्त होने की तिथि (अधिकतम 60 दिन) *
              </label>
              <input
                type="date"
                min={minDateStr}
                max={maxDateStr}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-white shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">विकल्प (Options - अधिकतम 15) *</label>
              <div className="space-y-3">
                {options.map((opt, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`उम्मीदवार / विकल्प ${index + 1}`}
                      required
                      className="flex-1 p-3 rounded-xl border border-emerald-200 text-sm bg-emerald-50/20"
                    />
                    {options.length > 2 && (
                      <button type="button" onClick={() => handleRemoveOption(index)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200 hover:bg-red-100">
                        हटाएँ
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 15 && (
                <button type="button" onClick={handleAddOption} className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800">
                  + नया विकल्प जोड़ें
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md transition text-base"
            >
              {loading ? 'प्रकाशित हो रहा है...' : 'सत्यापित पोल प्रकाशित करें'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CreatePoll() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-emerald-800 font-semibold bg-slate-50">लोड हो रहा है...</div>}>
      <CreatePollContent />
    </Suspense>
  );
}