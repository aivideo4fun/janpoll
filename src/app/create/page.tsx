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
  
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = maxDate.toISOString().split('T')[0];
  const minDateStr = new Date().toISOString().split('T')[0];
  const [expiryDate, setExpiryDate] = useState(minDateStr);

  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hierarchy States: District -> Tehsil -> Samiti -> Ward -> Village
  const [districts, setDistricts] = useState<LocItem[]>([]);
  const [tehsils, setTehsils] = useState<LocItem[]>([]);
  const [samitis, setSamitis] = useState<LocItem[]>([]);
  const [wards, setWards] = useState<LocItem[]>([]);
  const [villages, setVillages] = useState<LocItem[]>([]);
  const [gps, setGps] = useState<LocItem[]>([]);

  const [pickDistrictId, setPickDistrictId] = useState('');
  const [pickTehsilId, setPickTehsilId] = useState('');
  const [pickSamitiId, setPickSamitiId] = useState('');
  const [pickWardId, setPickWardId] = useState('');
  const [pickVillageId, setPickVillageId] = useState('');
  const [pickGpId, setPickGpId] = useState('');

  // 1. Load Districts
  useEffect(() => {
    fetch('/api/locations')
      .then((r) => r.json())
      .then((d) => setDistricts(d.items ?? []))
      .catch(() => {});
  }, []);

  // 2. Load Tehsils & Samitis on District Change
  useEffect(() => {
    setPickTehsilId('');
    setTehsils([]);
    setPickSamitiId('');
    setSamitis([]);
    if (!pickDistrictId) return;

    fetch(`/api/admin/locations?districtId=${pickDistrictId}&type=tehsil`)
      .then((r) => r.json())
      .then((d) => setTehsils(d.items ?? []))
      .catch(() => {});

    fetch(`/api/admin/locations?districtId=${pickDistrictId}`)
      .then((r) => r.json())
      .then((d) => setSamitis(d.items ?? []))
      .catch(() => {});
  }, [pickDistrictId]);

  // 3. Load Wards & Gram Panchayats on Samiti Change
  useEffect(() => {
    setPickWardId('');
    setWards([]);
    setPickGpId('');
    setGps([]);
    if (!pickSamitiId) return;

    fetch(`/api/admin/locations?samitiId=${pickSamitiId}`)
      .then((r) => r.json())
      .then((d) => setWards(d.items ?? []))
      .catch(() => {});

    fetch(`/api/locations?samitiId=${pickSamitiId}`)
      .then((r) => r.json())
      .then((d) => setGps(d.items ?? []))
      .catch(() => {});
  }, [pickSamitiId]);

  // 4. Load Villages on Ward Change
  useEffect(() => {
    setPickVillageId('');
    setVillages([]);
    if (!pickWardId) return;

    fetch(`/api/admin/locations?wardId=${pickWardId}`)
      .then((r) => r.json())
      .then((d) => setVillages(d.items ?? []))
      .catch(() => {});
  }, [pickWardId]);

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

    // Strict Google Authentication Check
    if (status !== 'authenticated' || !session) {
      setError('Kripya poll banane se pehle Google ke sath Sign In karein.');
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
    const selTehsil = tehsils.find((t) => t.id === pickTehsilId)?.nameHi || null;
    const selSamiti = samitis.find((s) => s.id === pickSamitiId)?.nameHi || null;
    const selWard = wards.find((w) => w.id === pickWardId)?.nameHi || null;
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

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-emerald-800 font-semibold">Load ho raha hai...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
      <div className="bg-white rounded-3xl shadow-md border border-emerald-100 p-8 md:p-10">
        <div className="mb-6 border-b border-emerald-100 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-emerald-900">Naya Opinion Poll Srijit Karein</h1>
            <p className="text-xs text-slate-500 mt-1">Sahi sthan aur chunav shreni chun kar naya poll banayein.</p>
          </div>
          <SmartBackLink fallbackHref="/" className="text-xs text-emerald-700 font-bold underline">
            &larr; Wapas Jayein
          </SmartBackLink>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{error}</div>}

        {!session ? (
          <div className="text-center py-12 space-y-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 p-8">
            <span className="text-4xl">🔐</span>
            <h3 className="font-bold text-gray-900 text-base">Google Pehchan Satyapan Awashyak Hai</h3>
            <p className="text-xs text-gray-500">Poll banane ke liye pehle Google account se sign in karein.</p>
            <button
              onClick={() => signIn('google')}
              className="px-6 py-3 bg-emerald-700 text-white font-bold rounded-xl text-sm shadow hover:bg-emerald-800 transition"
            >
              🌐 Google ke sath Sign In karein
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Chunav Shreni */}
            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">Chunav Shreni Chunein:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setElectionType('sarpanch')}
                  className={`p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    electionType === 'sarpanch' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  🟢 Sarpanch Chunav
                </button>
                <button
                  type="button"
                  onClick={() => setElectionType('samiti')}
                  className={`p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    electionType === 'samiti' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  🔵 Panchayat Samiti Ward
                </button>
                <button
                  type="button"
                  onClick={() => setElectionType('zila')}
                  className={`p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    electionType === 'zila' ? 'bg-emerald-700 text-white border-emerald-700 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  🟠 Zila Parishad Ward
                </button>
              </div>
            </div>

            {/* Location Hierarchy: Jila -> Tehsil -> Samiti -> Ward -> Village */}
            <div className="space-y-3 p-5 bg-emerald-50/40 rounded-2xl border border-emerald-200">
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">📍 Sthan Krama (Jila &rarr; Tehsil &rarr; Samiti &rarr; Ward)</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={pickDistrictId}
                  onChange={(e) => setPickDistrictId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">District (जिला) Chunein</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.nameHi}</option>)}
                </select>

                <select
                  value={pickTehsilId}
                  onChange={(e) => setPickTehsilId(e.target.value)}
                  disabled={!pickDistrictId}
                  className={selectClass}
                >
                  <option value="">Tehsil (तहसील) Chunein</option>
                  {tehsils.map((t) => <option key={t.id} value={t.id}>{t.nameHi}</option>)}
                </select>

                <select
                  value={pickSamitiId}
                  onChange={(e) => setPickSamitiId(e.target.value)}
                  disabled={!pickDistrictId}
                  className={selectClass}
                >
                  <option value="">Panchayat Samiti Chunein</option>
                  {samitis.map((s) => <option key={s.id} value={s.id}>{s.nameHi}</option>)}
                </select>

                {electionType === 'sarpanch' ? (
                  <select
                    value={pickGpId}
                    onChange={(e) => setPickGpId(e.target.value)}
                    disabled={!pickSamitiId}
                    className={selectClass}
                  >
                    <option value="">Gram Panchayat Chunein</option>
                    {gps.map((g) => <option key={g.id} value={g.id}>{g.nameHi}</option>)}
                  </select>
                ) : (
                  <>
                    <select
                      value={pickWardId}
                      onChange={(e) => setPickWardId(e.target.value)}
                      disabled={!pickSamitiId}
                      className={selectClass}
                    >
                      <option value="">Samiti Ward Chunein</option>
                      {wards.map((w) => <option key={w.id} value={w.id}>{w.nameHi}</option>)}
                    </select>

                    <select
                      value={pickVillageId}
                      onChange={(e) => setPickVillageId(e.target.value)}
                      disabled={!pickWardId}
                      className={`${selectClass} sm:col-span-2`}
                    >
                      <option value="">Ward ke antargat Village Chunein</option>
                      {villages.map((v) => <option key={v.id} value={v.id}>{v.nameHi}</option>)}
                    </select>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">Poll ka Prashn (Question) *</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Yaha apna prashn spasht shabdon mein likhein..."
                rows={3}
                required
                className="w-full p-4 rounded-xl border border-emerald-200 text-sm bg-emerald-50/20"
              />
            </div>

            {/* Calendar Expiry Date (Max 60 Days) */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                ⏳ Poll Samapt Hone ki Tithi (Calendar Expiry - Max 60 Days) *
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
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">Vikalp (Options - Maximum 15) *</label>
              <div className="space-y-3">
                {options.map((opt, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Uम्मीदवार / Vikalp ${index + 1}`}
                      required
                      className="flex-1 p-3 rounded-xl border border-emerald-200 text-sm bg-emerald-50/20"
                    />
                    {options.length > 2 && (
                      <button type="button" onClick={() => handleRemoveOption(index)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
                        Hataein
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 15 && (
                <button type="button" onClick={handleAddOption} className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800">
                  + Naya Vikalp Jodein
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md transition text-base"
            >
              {loading ? 'Prakashit ho raha hai...' : 'Satyapit Poll Prakashit Karein'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CreatePoll() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-emerald-800 font-semibold bg-slate-50">Load ho raha hai...</div>}>
      <CreatePollContent />
    </Suspense>
  );
}