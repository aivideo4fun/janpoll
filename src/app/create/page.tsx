'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import SmartBackLink from '@/components/SmartBackLink';

export const dynamic = 'force-dynamic'; 

type LocItem = { id: string; nameHi: string };

const autoQuestion = (gp: string) =>
  `${gp} ग्राम पंचायत में सरपंच पद के लिए सर्वाधिक उपयुक्त और योग्य उम्मीदवार कौन है?`;

const selectClass =
  'w-full px-3 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white disabled:bg-gray-100 disabled:text-gray-400';

function CreatePollContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const gpParam = searchParams.get('gp');
  const gpIdParam = searchParams.get('gpId'); 
  const samitiParam = searchParams.get('samiti');
  const districtParam = searchParams.get('district');

  // URL में पंचायत दी हुई है, तो वही उपयोग होगी; नहीं तो फॉर्म में चुनने का विकल्प दिखेगा
  const hasUrlLocation = Boolean(gpParam || gpIdParam);

  const [question, setQuestion] = useState(gpParam ? autoQuestion(gpParam) : '');
  const [questionTouched, setQuestionTouched] = useState(false);
  const [deadlineDays, setDeadlineDays] = useState('3');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // फॉर्म से स्थान चुनने की स्थिति
  const [districts, setDistricts] = useState<LocItem[]>([]);
  const [samitis, setSamitis] = useState<LocItem[]>([]);
  const [gps, setGps] = useState<LocItem[]>([]);
  const [pickDistrictId, setPickDistrictId] = useState('');
  const [pickSamitiId, setPickSamitiId] = useState('');
  const [pickGpId, setPickGpId] = useState('');
  const [existingPollId, setExistingPollId] = useState<string | null>(null);

  useEffect(() => {
    async function checkExistingPoll() {
      if (!gpParam && !gpIdParam) {
        setCheckingExisting(false);
        return;
      }

      try {
        const queryKey = gpIdParam ? `gpId=${gpIdParam}` : `gp=${encodeURIComponent(gpParam!)}`;
        const res = await fetch(`/api/polls/check?${queryKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.pollId) {
            router.replace(`/poll/${data.pollId}`);
            return;
          }
        }
      } catch (err) {
        console.error('मौजूदा जनमत संग्रह की जाँच करने में त्रुटि:', err);
      } finally {
        setCheckingExisting(false);
      }
    }

    checkExistingPoll();
  }, [gpParam, gpIdParam, router]);

  // जिलों की सूची (सिर्फ़ तब जब URL में पंचायत नहीं है)
  useEffect(() => {
    if (hasUrlLocation) return;
    let cancelled = false;
    fetch('/api/locations')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setDistricts(d.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hasUrlLocation]);

  // जिला बदलने पर पंचायत समितियाँ
  useEffect(() => {
    setPickSamitiId('');
    setSamitis([]);
    if (!pickDistrictId) return;
    let cancelled = false;
    fetch(`/api/locations?districtId=${encodeURIComponent(pickDistrictId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setSamitis(d.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pickDistrictId]);

  // समिति बदलने पर ग्राम पंचायतें
  useEffect(() => {
    setPickGpId('');
    setGps([]);
    if (!pickSamitiId) return;
    let cancelled = false;
    fetch(`/api/locations?samitiId=${encodeURIComponent(pickSamitiId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setGps(d.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pickSamitiId]);

  // चुनी हुई पंचायत का पोल पहले से बना है?
  useEffect(() => {
    setExistingPollId(null);
    if (!pickGpId) return;
    let cancelled = false;
    fetch(`/api/polls/check?gpId=${encodeURIComponent(pickGpId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.pollId) setExistingPollId(d.pollId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pickGpId]);

  // अंतिम (उपयोग होने वाला) स्थान
  const selDistrict = districts.find((d) => d.id === pickDistrictId);
  const selSamiti = samitis.find((s) => s.id === pickSamitiId);
  const selGp = gps.find((g) => g.id === pickGpId);

  const districtName = hasUrlLocation ? districtParam : selDistrict?.nameHi ?? null;
  const samitiName = hasUrlLocation ? samitiParam : selSamiti?.nameHi ?? null;
  const gramPanchayatName = hasUrlLocation ? gpParam : selGp?.nameHi ?? null;
  const gramPanchayatId = hasUrlLocation ? gpIdParam || null : selGp?.id ?? null;

  const handleGpPick = (id: string) => {
    setPickGpId(id);
    const gp = gps.find((g) => g.id === id);
    if (gp && !questionTouched) {
      setQuestion(autoQuestion(gp.nameHi));
    }
  };

  const handleAddOption = () => {
    if (options.length < 15) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!session) {
      setError('कृपया आगे बढ़ने से पहले अपने गूगल खाते से प्रमाणीकरण (Sign In) पूर्ण करें।');
      return;
    }

    if (existingPollId) {
      setError('इस पंचायत का पोल पहले से बना हुआ है। कृपया उसी पोल को खोलें।');
      return;
    }

    if (!question.trim()) {
      setError('कृपया जनमत संग्रह का मुख्य प्रश्न दर्ज करें।');
      return;
    }

    const validOptions = options.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('कम से कम 2 विकल्प दर्ज करना अनिवार्य है।');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          deadlineDays: parseInt(deadlineDays),
          options: validOptions,
          districtName: districtName || null,
          samitiName: samitiName || null,
          gramPanchayatName: gramPanchayatName || null,
          // पंचायत का id टेक्स्ट (cuid) है, इसलिए parseInt नहीं करना है
          gramPanchayatId: gramPanchayatId || null,
          creatorName: session.user?.name || null,
          creatorEmail: session.user?.email || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'पोल प्रकाशित करते समय तकनीकी त्रुटि उत्पन्न हुई।');
      }

      router.push(`/poll/${data.pollId}`);
    } catch (err: any) {
      setError(err.message || 'अपेक्षित त्रुटि, कृपया कुछ समय पश्चात पुनः प्रयास करें।');
      setLoading(false);
    }
  };

  if (status === 'loading' || checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center text-emerald-800 font-semibold bg-slate-50">
        सत्यापन किया जा रहा है कि इस क्षेत्र में पूर्व में कोई जनमत संग्रह सक्रिय है या नहीं...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-gray-800">
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 md:p-8">
        
        <div className="mb-6 border-b border-emerald-100 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-emerald-900">
              नया सत्यापित पोल सृजित करें {gramPanchayatName ? `- ${gramPanchayatName}` : ''}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {gramPanchayatName
                ? `${districtName || 'राजस्थान'} / ${samitiName || ''} / ${gramPanchayatName}`
                : 'सुरक्षित और गूगल-सत्यापित लोक-मत मंच।'}
            </p>
          </div>
          <SmartBackLink fallbackHref="/" className="text-xs text-emerald-700 font-bold underline">
            &larr; पिछले पेज पर
          </SmartBackLink>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {!session ? (
          <div className="text-center py-10 space-y-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6">
            <span className="text-4xl">🔐</span>
            <div>
              <h3 className="font-bold text-gray-900 text-base">गूगल पहचान सत्यापन आवश्यक है</h3>
              <p className="text-xs text-gray-500 mt-1">
                अवांछित या अनधिकृत प्रविष्टियों को रोकने के लिए जनमत संग्रह सृजित करने से पूर्व अपने गूगल खाते से प्रवेश करें।
              </p>
            </div>
            <button
              onClick={() => signIn('google')}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition shadow flex items-center justify-center gap-2 mx-auto"
            >
              <span>🌐</span> गूगल के साथ साइन इन करें
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-800 font-bold">प्रत्यापित निर्माता (Verified Creator):</p>
                <p className="text-sm font-semibold text-gray-900">{session.user?.name} ({session.user?.email})</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-700 text-white text-xs font-bold rounded-lg">
                ✓ गूगल सत्यापित
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* 📍 पोल किस क्षेत्र का है? (सिर्फ़ तब जब URL में पंचायत नहीं दी गई) */}
              {!hasUrlLocation && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    📍 पोल किस क्षेत्र का है? (अनुशंसित)
                  </p>
                  <p className="text-[11px] leading-4 text-gray-500">
                    पंचायत चुनने पर पोल सीधे उसी पंचायत, समिति और जिले के पेज पर दिखेगा। न चुनें तो एडमिन बाद में जोड़ देगा।
                  </p>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <select
                      value={pickDistrictId}
                      onChange={(e) => setPickDistrictId(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">जिला चुनें</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nameHi}
                        </option>
                      ))}
                    </select>

                    <select
                      value={pickSamitiId}
                      onChange={(e) => setPickSamitiId(e.target.value)}
                      disabled={!pickDistrictId}
                      className={selectClass}
                    >
                      <option value="">पंचायत समिति</option>
                      {samitis.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nameHi}
                        </option>
                      ))}
                    </select>

                    <select
                      value={pickGpId}
                      onChange={(e) => handleGpPick(e.target.value)}
                      disabled={!pickSamitiId}
                      className={selectClass}
                    >
                      <option value="">ग्राम पंचायत</option>
                      {gps.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nameHi}
                        </option>
                      ))}
                    </select>
                  </div>

                  {existingPollId && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-900">
                      इस पंचायत का पोल पहले से बना हुआ है।{' '}
                      <Link href={`/poll/${existingPollId}`} className="font-black underline">
                        पोल खोलें →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  जनमत संग्रह प्रश्न (Question) *
                </label>
                <textarea
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    setQuestionTouched(true);
                  }}
                  placeholder="यहाँ अपना प्रश्न स्पष्ट शब्दों में लिखें..."
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-emerald-50/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  ⏳ सक्रिय समयावधि (Duration) *
                </label>
                <select
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-emerald-50/20"
                >
                  <option value="1">1 दिन (24 घंटे)</option>
                  <option value="3">3 दिन</option>
                  <option value="5">5 दिन</option>
                  <option value="7">7 दिन (एक सप्ताह)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                  विकल्प (Options - अधिकतम 15) *
                </label>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`उम्मीदवार / विकल्प ${index + 1}`}
                        required
                        className="flex-1 px-4 py-2 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-emerald-50/20"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs transition border border-red-200"
                        >
                          हटाएँ
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 15 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                  >
                    + नया विकल्प जोड़ें (अधिकतम 15)
                  </button>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || Boolean(existingPollId)}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition text-base disabled:opacity-50"
                >
                  {loading ? 'पोल प्रकाशित किया जा रहा है...' : 'सत्यापित पोल प्रकाशित करें'}
                </button>
              </div>

            </form>
          </div>
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