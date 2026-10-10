'use client';

import { useState } from 'react';

export default function AdminLocationManager() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSamiti, setSelectedSamiti] = useState('');
  const [type, setType] = useState('gramPanchayat');
  
  // Manual Input states
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [wardNo, setWardNo] = useState('');

  // Bulk Input states
  const [jsonInput, setJsonInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Prisma states
  const [dbLoading, setDbLoading] = useState(false);
  const [dbOutput, setDbOutput] = useState('');

  // मैन्युअल फॉर्म सबमिट करना
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let payloadData = [];
      if (type === 'gramPanchayat') {
        payloadData = [{ nameEn, nameHi: nameHi || nameEn }];
      } else {
        payloadData = [{ wardNo: Number(wardNo), nameHi: nameHi || `वार्ड ${wardNo}` }];
      }

      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          districtId: selectedDistrict,
          samitiId: selectedSamiti,
          dataList: payloadData,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessage('सफलतापूर्वक जोड़ दिया गया है!');
        setNameEn('');
        setNameHi('');
        setWardNo('');
      } else {
        setMessage(result.message || 'त्रुटि हुई');
      }
    } catch (err: any) {
      setMessage(err.message || 'कनेक्शन त्रुटि');
    } finally {
      setLoading(false);
    }
  };

  // बल्क फॉर्म सबमिट करना
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let parsedData = JSON.parse(jsonInput);
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          districtId: selectedDistrict,
          samitiId: selectedSamiti,
          dataList: parsedData,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessage(result.message);
        setJsonInput('');
      } else {
        setMessage(result.message || 'त्रुटि हुई');
      }
    } catch (err: any) {
      setMessage('JSON फॉर्मेट अमान्य है। कृपया सही फॉर्मेट जांचें।');
    } finally {
      setLoading(false);
    }
  };

  // Prisma Generate / Push Handler
  const handlePrismaAction = async (action: 'generate' | 'push' | 'full') => {
    setDbLoading(true);
    setDbOutput('');
    try {
      const res = await fetch('/api/admin/db-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setDbOutput(data.output || data.message);
      } else {
        setDbOutput(`Error: ${data.message}`);
      }
    } catch (err: any) {
      setDbOutput(`Connection Error: ${err.message}`);
    } finally {
      setDbLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Main Location Manager Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-2xl font-black text-slate-900 mb-2">📍 एडमिन लोकेशन और वार्ड मैनेजर</h1>
          <p className="text-slate-600 mb-6 text-sm">नई ग्राम पंचायतें या जिला परिषद वार्ड्स मैन्युअल रूप से या बल्क में जोड़ें।</p>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('manual')}
              className={`pb-3 px-4 font-bold text-sm border-b-2 transition ${
                activeTab === 'manual' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
              }`}
            >
              ➕ मैन्युअल जोड़ें (Single Add)
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`pb-3 px-4 font-bold text-sm border-b-2 transition ${
                activeTab === 'bulk' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
              }`}
            >
              📂 बल्क / एक्सेल अपलोड (Bulk Add)
            </button>
          </div>

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-sm">
              {message}
            </div>
          )}

          {/* Common Selectors */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">जोड़ने का प्रकार:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600"
              >
                <option value="gramPanchayat">ग्राम पंचायत (Gram Panchayat)</option>
                <option value="zilaWard">जिला परिषद वार्ड (Zila Parishad Ward)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">District ID (जिले की आईडी):</label>
              <input
                type="text"
                placeholder="जिले की ID दर्ज करें (उदा. clxyz...)"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {type === 'gramPanchayat' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Panchayat Samiti ID:</label>
                <input
                  type="text"
                  placeholder="पचायत समिति की ID दर्ज करें"
                  value={selectedSamiti}
                  onChange={(e) => setSelectedSamiti(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            )}
          </div>

          {/* Tab 1: Manual Form */}
          {activeTab === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {type === 'gramPanchayat' ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ग्राम पंचायत का नाम (English):</label>
                    <input
                      type="text"
                      placeholder="उदा. Timeda Bada"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ग्राम पंचायत का नाम (हिंदी):</label>
                    <input
                      type="text"
                      placeholder="उदा. टिमेडा बड़ा"
                      value={nameHi}
                      onChange={(e) => setNameHi(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-300"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">वार्ड नंबर:</label>
                  <input
                    type="number"
                    placeholder="उदा. 5"
                    value={wardNo}
                    onChange={(e) => setWardNo(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300"
                  />
                  <label className="block text-sm font-bold text-slate-700 mt-3 mb-1">वार्ड का नाम (हिंदी):</label>
                  <input
                    type="text"
                    placeholder="उदा. वार्ड 5 - अजमेर"
                    value={nameHi}
                    onChange={(e) => setNameHi(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition shadow mt-4"
              >
                {loading ? 'जोड़ा जा रहा है...' : '➕ व्यक्तिगत रूप से जोड़ें'}
              </button>
            </form>
          ) : (
            /* Tab 2: Bulk Form */
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">JSON डेटा पेस्ट करें:</label>
                <textarea
                  rows={6}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='[{"nameEn": "Panchayat1", "nameHi": "पंचायत १"}, {"nameEn": "Panchayat2", "nameHi": "पंचायत २"}]'
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition shadow"
              >
                {loading ? 'अपलोड हो रहा है...' : '📂 बल्क डेटाबेस में सेव करें'}
              </button>
            </form>
          )}
        </div>

        {/* 🛠️ NEW: Database & Prisma Controls Section in UI */}
        <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-sm border border-slate-800">
          <h2 className="text-xl font-bold mb-2">🛠️ डेटाबेस और प्रिस्मा कंट्रोल (Prisma Controls)</h2>
          <p className="text-xs text-slate-400 mb-6">
            जब भी आप डेटाबेस स्कीमा (`schema.prisma`) में कोई बदलाव करें, आप यहाँ से सीधे कमांड रन कर सकते हैं।
          </p>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={() => handlePrismaAction('generate')}
              disabled={dbLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition shadow"
            >
              {dbLoading ? 'प्रक्रिया जारी है...' : '⚡ Run Prisma Generate'}
            </button>
            <button
              onClick={() => handlePrismaAction('push')}
              disabled={dbLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition shadow"
            >
              {dbLoading ? 'प्रक्रिया जारी है...' : '🚀 Run DB Push'}
            </button>
          </div>

          {dbOutput && (
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-400 block mb-1">कमांड आउटपुट (Output):</span>
              <pre className="bg-black/70 p-4 rounded-xl text-[11px] text-emerald-400 overflow-x-auto font-mono border border-slate-800">
                {dbOutput}
              </pre>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}