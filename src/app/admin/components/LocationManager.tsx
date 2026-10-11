'use client';

import { useState, useEffect } from 'react';
import LocationPicker from './LocationPicker';

type District = { id: string; nameHi: string; nameEn: string };
type Samiti = { id: string; nameHi: string; nameEn: string };

type LocationManagerProps = {
  districts: District[];
  addSamitis: (formData: FormData) => Promise<void>;
  addGramPanchayats: (formData: FormData) => Promise<void>;
  addZilaWards: (formData: FormData) => Promise<void>;
};

const cardClass = 'space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm';
const textareaClass =
  'w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs leading-6 outline-none focus:border-blue-500';
const buttonClass =
  'rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800';
const selectClass =
  'w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-xs text-gray-800 outline-none focus:border-blue-500';

export default function LocationManager({
  districts,
  addSamitis,
  addGramPanchayats,
  addZilaWards,
}: LocationManagerProps) {
  // Gram Panchayat ke liye local district & samiti selection state
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [samitis, setSamitis] = useState<Samiti[]>([]);
  const [selectedSamitiId, setSelectedSamitiId] = useState('');

  // District badalne par uske anuroop Panchayat Samitis fetch karna
  useEffect(() => {
    setSelectedSamitiId('');
    setSamitis([]);
    if (!selectedDistrictId) return;

    fetch(`/api/admin/locations?districtId=${selectedDistrictId}&type=samiti`)
      .then((res) => res.json())
      .then((data) => setSamitis(data.items ?? []))
      .catch((err) => console.error('Samiti fetch error:', err));
  }, [selectedDistrictId]);

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
        हर पंक्ति में एक नाम लिखें: <strong>हिंदी नाम | English name</strong>। English न लिखें तो हिंदी नाम ही उपयोग होगा।
        जो नाम पहले से मौजूद हैं वे अपने आप छोड़ दिए जाते हैं, इसलिए सूची दोबारा चिपकाने से कुछ नहीं बिगड़ता।
      </p>

      {/* 1. पंचायत समिति जोड़ें */}
      <form action={addSamitis} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏛️ पंचायत समितियाँ जोड़ें</h3>
        <LocationPicker districts={districts} depth="district" />
        <textarea
          name="items"
          required
          rows={5}
          placeholder={'अजमेर | Ajmer\nकिशनगढ़ | Kishangarh'}
          className={textareaClass}
        />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>
            + समितियाँ जोड़ें
          </button>
        </div>
      </form>

      {/* 2. ग्राम पंचायतें जोड़ें (Fixed Hierarchy Layout) */}
      <form action={addGramPanchayats} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏘️ ग्राम पंचायतें जोड़ें</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pehle District select karein */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">जिला चुनें</label>
            <select
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className={selectClass}
              required
            >
              <option value="">-- जिला चुनें --</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameHi} ({d.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Uske baad us district ki Samiti select karein */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">पंचायत समिति चुनें</label>
            <select
              name="samitiId"
              value={selectedSamitiId}
              onChange={(e) => setSelectedSamitiId(e.target.value)}
              disabled={!selectedDistrictId}
              className={`${selectClass} disabled:bg-gray-100`}
              required
            >
              <option value="">-- पंचायत समिति चुनें --</option>
              {samitis.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameHi}
                </option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          name="items"
          required
          rows={6}
          placeholder={'रामगढ़ | Ramgarh\nनया गाँव | Naya Gaon'}
          className={textareaClass}
        />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>
            + पंचायतें जोड़ें
          </button>
        </div>
      </form>

      {/* 3. जिला परिषद वार्ड जोड़ें */}
      <form action={addZilaWards} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🗳️ जिला परिषद वार्ड जोड़ें</h3>
        <LocationPicker districts={districts} depth="district" />
        <p className="text-[11px] text-gray-500">हर पंक्ति: वार्ड नंबर | वार्ड का नाम (नाम वैकल्पिक)</p>
        <textarea
          name="items"
          required
          rows={5}
          placeholder={'1 | वार्ड 1 (अजमेर शहर)\n2 | वार्ड 2\n3'}
          className={textareaClass}
        />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>
            + वार्ड जोड़ें
          </button>
        </div>
      </form>
    </div>
  );
}