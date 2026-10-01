'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('संदेश सफलतापूर्वक भेज दिया गया है!');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus(data.message || 'त्रुटि हुई।');
      }
    } catch (err) {
      setStatus('सर्वर से कनेक्ट करने में विफल।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Link href="/" className="text-emerald-700 font-semibold text-sm">&larr; होम पेज पर वापस जाएं</Link>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 mt-4">
        <h1 className="text-2xl font-black text-emerald-900 mb-2">संपर्क करें (Contact Us)</h1>
        <p className="text-xs text-gray-500 mb-6">यदि आपके पास कोई सुझाव, प्रश्न या विज्ञापन (Advertising) संबंधी पूछताछ है, तो आप हमें संदेश भेज सकते हैं।</p>

        {status && (
          <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${status.includes('सफलता') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {status}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">आपका नाम *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="जैसे: विक्रम सिंह"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">ईमेल आईडी *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">संदेश या सुझाव (MESSAGE) *</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="अपना संदेश यहाँ लिखें..."
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition shadow"
          >
            {loading ? 'भेजा जा रहा है...' : 'संदेश भेजें (Send Message)'}
          </button>
        </form>
      </div>
    </div>
  );
}