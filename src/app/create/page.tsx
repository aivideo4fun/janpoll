'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; 

function CreatePollContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const gpParam = searchParams.get('gp');
  const gpIdParam = searchParams.get('gpId'); 
  const samitiParam = searchParams.get('samiti');
  const districtParam = searchParams.get('district');

  const [question, setQuestion] = useState(
    gpParam ? `${gpParam} ग्राम पंचायत में सरपंच पद के लिए सर्वाधिक उपयुक्त और योग्य उम्मीदवार कौन है?` : ''
  );
  const [deadlineDays, setDeadlineDays] = useState('3');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

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
      setError('कृपया आगे बढ़ने से पहले अपने गूगल खाते से प्रमाणीकरण (Sign In) पूर्ण करें।');
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
          districtName: districtParam || null,
          samitiName: samitiParam || null,
          gramPanchayatName: gpParam || null,
          gramPanchayatId: gpIdParam ? parseInt(gpIdParam, 10) : null,
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
              नया सत्यापित पोल सृजित करें {gpParam ? `- ${gpParam}` : ''}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {gpParam ? `${districtParam || 'राजस्थान'} / ${samitiParam || ''} / ${gpParam}` : 'सुरक्षित और गूगल-सत्यापित लोक-मत मंच।'}
            </p>
          </div>
          <Link href="/" className="text-xs text-emerald-700 font-bold underline">
            &larr; मुख्य पृष्ठ
          </Link>
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
              <div>
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  जनमत संग्रह प्रश्न (Question) *
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
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
                    + नया विकल्प जोड़ें (अधिकतम 15)
                  </button>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
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