'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

export default function CreatePoll() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [question, setQuestion] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('3');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddOption = () => {
    if (options.length < 8) {
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
      setError('कृपया पहले Google से साइन इन करें।');
      return;
    }

    if (!question.trim()) {
      setError('कृपया पोल का सवाल दर्ज करें।');
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'पोल बनाते समय त्रुटि हुई');
      }

      router.push(`/poll/${data.pollId}`);
    } catch (err: any) {
      setError(err.message || 'कुछ गलत हो गया, कृपया पुनः प्रयास करें।');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-emerald-800 font-semibold">
        लोड हो रहा है...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-gray-800">
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 md:p-8">
        
        {/* Header */}
        <div className="mb-6 border-b border-emerald-100 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-emerald-900">
              नया सत्यापित पोल बनाएँ
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Google द्वारा सुरक्षित और वेरिफाइड पोल पब्लिश करें।
            </p>
          </div>
          <Link href="/" className="text-xs text-emerald-700 font-bold underline">
            &larr; होम
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!session ? (
          /* Agar user Google se sign-in nahi hai */
          <div className="text-center py-10 space-y-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6">
            <span className="text-4xl">🔐</span>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Google पहचान सत्यापन आवश्यक है</h3>
              <p className="text-xs text-gray-500 mt-1">
                फर्जी या आपत्तिजनक पोस्ट रोकने के लिए पोल बनाने से पहले अपने Google खाते से लॉगिन करें। कोई लंबी फॉर्म प्रक्रिया नहीं है!
              </p>
            </div>
            <button
              onClick={() => signIn('google')}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition shadow flex items-center justify-center gap-2 mx-auto"
            >
              <span>🌐</span> Sign in with Google
            </button>
          </div>
        ) : (
          /* Agar user logged in hai, toh asli verified details ke sath form dikhayein */
          <div>
            <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-800 font-bold">वेरिफाइड क्रिएटर:</p>
                <p className="text-sm font-semibold text-gray-900">{session.user?.name} ({session.user?.email})</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-700 text-white text-xs font-bold rounded-lg">
                ✓ Google Verified
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Poll Question */}
              <div>
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  पोल का सवाल (Question) *
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="पोल का सवाल लिखें..."
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-emerald-50/20"
                />
              </div>

              {/* Poll Duration */}
              <div>
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  ⏳ पोल की समय-सीमा (Duration) *
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

              {/* Options */}
              <div>
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                  विकल्प (Options - Max 8) *
                </label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`विकल्प ${index + 1}`}
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

                {options.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    + विकल्प जोड़ें (Add Option)
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition text-base disabled:opacity-50"
                >
                  {loading ? 'पोल पब्लिश हो रहा है...' : 'सत्यापित पोल पब्लिश करें'}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}