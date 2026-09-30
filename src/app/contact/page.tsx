'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link href="/" className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm flex items-center gap-1">
          &larr; होम पेज पर वापस जाएं
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-black text-emerald-900 mb-2">
          संपर्क करें (Contact Us)
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mb-6">
          यदि आपके पास कोई सुझाव, प्रश्न या विज्ञापन (Advertising) संबंधी पूछताछ है, तो आप हमें संदेश भेज सकते हैं।
        </p>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl text-center space-y-2">
            <div className="text-xl font-bold">✅ संदेश प्राप्त हुआ!</div>
            <p className="text-xs text-gray-600">हमसे संपर्क करने के लिए धन्यवाद। हमारी टीम जल्द ही आपसे संपर्क करेगी।</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                आपका नाम *
              </label>
              <input
                type="text"
                required
                placeholder="जैसे: विक्रम सिंह"
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-emerald-50/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                ईमेल आईडी *
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-emerald-50/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                संदेश या सुझाव (Message) *
              </label>
              <textarea
                required
                rows={4}
                placeholder="अपना संदेश यहाँ लिखें..."
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-emerald-50/20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition text-base"
            >
              संदेश भेजें (Send Message)
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-emerald-100 text-center text-xs text-gray-500">
          या सीधा ईमेल करें: <span className="font-semibold text-emerald-800">support@janpoll.in</span>
        </div>
      </div>
    </div>
  );
}