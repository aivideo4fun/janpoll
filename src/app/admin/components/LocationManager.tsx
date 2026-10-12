'use client';

import { useState, useEffect } from 'react';
import LocationPicker from './LocationPicker';

type District = { id: string; nameHi: string; nameEn: string };
type Samiti = { id: string; nameHi: string; nameEn: string };

type LocationManagerProps = {
  districts: District[];
  addSamitis: (formData: FormData) => Promise<void>;
  addGramPanchayats: (formData: FormData) => Promise<void>;
  addSamitiWards: (formData: FormData) => Promise<void>;
  addZilaWards: (formData: FormData) => Promise<void>;
  updateLocationName: (formData: FormData) => Promise<void>;
};

const cardClass = 'space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm';
const textareaClass =
  'w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs leading-6 outline-none focus:border-blue-500';
const buttonClass =
  'rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800';
const selectClass =
  'w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-xs text-gray-800 outline-none focus:border-blue-500';
const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-xs text-gray-800 outline-none focus:border-blue-500';

export default function LocationManager({
  districts,
  addSamitis,
  addGramPanchayats,
  addSamitiWards,
  addZilaWards,
  updateLocationName,
}: LocationManagerProps) {
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [samitis, setSamitis] = useState<Samiti[]>([]);
  const [selectedSamitiId, setSelectedSamitiId] = useState('');

  // पंचायत समिति लोड करना
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
    <div className="space-y-6">
      <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
        💡 <strong>निर्देश:</strong> हर पंक्ति में एक नाम लिखें: <strong>हिंदी नाम | English name</strong>। यदि किसी नाम या स्पेलिंग में सुधार करना हो, तो सबसे नीचे दिए गए <strong>'स्थान का नाम सुधारें'</strong> विकल्प का उपयोग करें।
      </p>

      {/* 1. पंचायत समितियाँ जोड़ें */}
      <form action={addSamitis} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏛️ पंचायत समितियाँ जोड़ें</h3>
        <LocationPicker districts={districts} depth="district" />
        <textarea
          name="items"
          required
          rows={4}
          placeholder={'अजमेर | Ajmer\nकिशनगढ़ | Kishangarh'}
          className={textareaClass}
        />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>
            + समितियाँ जोड़ें
          </button>
        </div>
      </form>

      {/* 2. ग्राम पंचायतें जोड़ें */}
      <form action={addGramPanchayats} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏘️ ग्राम पंचायतें जोड़ें</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          rows={5}
          placeholder={'रामगढ़ | Ramgarh\nनया गाँव | Naya Gaon'}
          className={textareaClass}
        />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>
            + पंचायतें जोड़ें
          </button>
        </div>
      </form>

      {/* 3. पंचायत समिति वार्ड जोड़ें (नया विकल्प) */}
      <form action={addSamitiWards} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🗳️ पंचायत समिति वार्ड जोड़ें (Samiti Wards)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <p className="text-[11px] text-gray-500">हर पंक्ति: वार्ड नंबर | वार्ड का नाम (जैसे: 1 | वार्ड 1 - मुख्य क्षेत्र)</p>
        <textarea
          name="items"
          required
          rows={4}
          placeholder={'1 | वार्ड 1\n2 | वार्ड 2'}
          className={textareaClass}
        />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>
            + समिति वार्ड जोड़ें
          </button>
        </div>
      </form>

      {/* 4. जिला परिषद वार्ड जोड़ें */}
      <form action={addZilaWards} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏛️ जिला परिषद वार्ड जोड़ें</h3>
        <LocationPicker districts={districts} depth="district" />
        <textarea
          name="items"
          required
          rows={4}
          placeholder={'1 | वार्ड 1\n2 | वार्ड 2'}
          className={textareaClass}
        />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>
            + जिला परिषद वार्ड जोड़ें
          </button>
        </div>
      </form>

      {/* 5. स्थान का नाम सुधारें / अपडेट करें (Spelling / Correction) */}
      <form action={updateLocationName} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
        <h3 className="text-sm font-black text-amber-900">✏️ स्थान का नाम सुधारें (Spelling / Pronunciation Fix)</h3>
        <p className="text-[11px] text-amber-800">यदि किसी तहसील, पंचायत या वार्ड के नाम में वर्तनी (Spelling) की त्रुटि हो, तो उसकी डेटाबेस आईडी और नया सही नाम यहाँ दर्ज करें।</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select name="locType" className={selectClass} required>
            <option value="">-- स्थान श्रेणी चुनें --</option>
            <option value="tehsil">तहसील (Tehsil)</option>
            <option value="samiti">पंचायत समिति (Samiti)</option>
            <option value="gp">ग्राम पंचायत (GP)</option>
            <option value="samitiWard">समिति वार्ड (Samiti Ward)</option>
            <option value="zilaWard">जिला परिषद वार्ड (Zila Ward)</option>
          </select>
          <input
            type="text"
            name="locId"
            placeholder="स्थान की ID (Database ID)"
            className={inputClass}
            required
          />
          <input
            type="text"
            name="nameHi"
            placeholder="नया सही हिंदी नाम"
            className={inputClass}
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-800"
          >
            नाम अपडेट करें
          </button>
        </div>
      </form>
    </div>
  );
}