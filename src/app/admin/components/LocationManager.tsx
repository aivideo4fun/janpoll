'use client';

import { useState, useEffect } from 'react';
import LocationPicker from './LocationPicker';

type District = { id: string; nameHi: string; nameEn: string };
type Samiti = { id: string; nameHi: string; nameEn: string };
type ItemType = { id: string; nameHi: string; wardNo?: number };

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

  // ✏️ नाम सुधारने (Edit) के लिए स्टेट्स
  const [editLocType, setEditLocType] = useState('');
  const [editDistrictId, setEditDistrictId] = useState('');
  const [editSamitiId, setEditSamitiId] = useState('');
  const [editItemList, setEditItemList] = useState<ItemType[]>([]);
  const [selectedEditId, setSelectedEditId] = useState('');

  // पंचायत समिति लोड करना (मुख्य फॉर्म के लिए)
  useEffect(() => {
    setSelectedSamitiId('');
    setSamitis([]);
    if (!selectedDistrictId) return;

    fetch(`/api/admin/locations?districtId=${selectedDistrictId}&type=samiti`)
      .then((res) => res.json())
      .then((data) => setSamitis(data.items ?? []))
      .catch((err) => console.error('समिति लोड त्रुटि:', err));
  }, [selectedDistrictId]);

  // ✏️ नाम सुधारने वाले फॉर्म के लिए डायनेमिक डेटा लोड करना
  useEffect(() => {
    setSelectedEditId('');
    setEditItemList([]);
    if (!editLocType) return;

    if (editLocType === 'tehsil' || editLocType === 'zilaWard' || editLocType === 'samiti') {
      if (!editDistrictId) return;
      let apiType = editLocType === 'tehsil' ? 'tehsil' : editLocType === 'zilaWard' ? 'zilaWard' : 'samiti';
      fetch(`/api/admin/locations?districtId=${editDistrictId}&type=${apiType}`)
        .then((res) => res.json())
        .then((data) => setEditItemList(data.items ?? []))
        .catch((err) => console.error('एडिट लिस्ट लोड त्रुटि:', err));
    } else if (editLocType === 'gp' || editLocType === 'samitiWard') {
      if (!editSamitiId) return;
      let apiType = editLocType === 'gp' ? 'gp' : 'samitiWard';
      fetch(`/api/admin/locations?samitiId=${editSamitiId}&type=${apiType}`)
        .then((res) => res.json())
        .then((data) => setEditItemList(data.items ?? []))
        .catch((err) => console.error('एडिट लिस्ट लोड त्रुटि:', err));
    }
  }, [editLocType, editDistrictId, editSamitiId]);

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
        💡 <strong>निर्देश:</strong> हर पंक्ति में एक नाम लिखें: <strong>हिंदी नाम | English name</strong>। यदि किसी नाम या स्पेलिंग में सुधार करना हो, तो नीचे दिए गए <strong>'स्थान का नाम सुधारें'</strong> सेक्शन में सीधे जिले/समिति से चुनकर नाम बदलें।
      </p>

      {/* 1. पंचायत समितियाँ जोड़ें */}
      <form action={addSamitis} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏛️ पंचायत समितियाँ जोड़ें</h3>
        <LocationPicker districts={districts} depth="district" />
        <textarea name="items" required rows={4} placeholder={'अजमेर | Ajmer'} className={textareaClass} />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>+ समितियाँ जोड़ें</button>
        </div>
      </form>

      {/* 2. ग्राम पंचायतें जोड़ें */}
      <form action={addGramPanchayats} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏘️ ग्राम पंचायतें जोड़ें</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">जिला चुनें</label>
            <select value={selectedDistrictId} onChange={(e) => setSelectedDistrictId(e.target.value)} className={selectClass} required>
              <option value="">-- जिला चुनें --</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.nameHi} ({d.nameEn})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">पंचायत समिति चुनें</label>
            <select name="samitiId" value={selectedSamitiId} onChange={(e) => setSelectedSamitiId(e.target.value)} disabled={!selectedDistrictId} className={`${selectClass} disabled:bg-gray-100`} required>
              <option value="">-- पंचायत समिति चुनें --</option>
              {samitis.map((s) => <option key={s.id} value={s.id}>{s.nameHi}</option>)}
            </select>
          </div>
        </div>
        <textarea name="items" required rows={5} placeholder={'रामगढ़ | Ramgarh'} className={textareaClass} />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>+ पंचायतें जोड़ें</button>
        </div>
      </form>

      {/* 3. पंचायत समिति वार्ड जोड़ें */}
      <form action={addSamitiWards} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🗳️ पंचायत समिति वार्ड जोड़ें</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">जिला चुनें</label>
            <select value={selectedDistrictId} onChange={(e) => setSelectedDistrictId(e.target.value)} className={selectClass} required>
              <option value="">-- जिला चुनें --</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.nameHi}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">पंचायत समिति चुनें</label>
            <select name="samitiId" value={selectedSamitiId} onChange={(e) => setSelectedSamitiId(e.target.value)} disabled={!selectedDistrictId} className={`${selectClass} disabled:bg-gray-100`} required>
              <option value="">-- पंचायत समिति चुनें --</option>
              {samitis.map((s) => <option key={s.id} value={s.id}>{s.nameHi}</option>)}
            </select>
          </div>
        </div>
        <textarea name="items" required rows={4} placeholder={'1 | वार्ड 1'} className={textareaClass} />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>+ समिति वार्ड जोड़ें</button>
        </div>
      </form>

      {/* 4. जिला परिषद वार्ड जोड़ें */}
      <form action={addZilaWards} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏛️ जिला परिषद वार्ड जोड़ें</h3>
        <LocationPicker districts={districts} depth="district" />
        <textarea name="items" required rows={4} placeholder={'1 | वार्ड 1'} className={textareaClass} />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>+ जिला परिषद वार्ड जोड़ें</button>
        </div>
      </form>

      {/* 5. ✏️ स्थान का नाम सुधारें (Smart Interactive Dropdown - No ID required) */}
      <form action={updateLocationName} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
        <h3 className="text-sm font-black text-amber-900">✏️ स्थान का नाम सुधारें (Spelling / Pronunciation Fix)</h3>
        <p className="text-[11px] text-amber-800">श्रेणी और स्थान चुनकर नया सही नाम दर्ज करें। अब डेटाबेस आईडी याद रखने की आवश्यकता नहीं है!</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* स्थान श्रेणी */}
          <div>
            <label className="block text-[11px] font-bold text-amber-900 mb-1">1. श्रेणी चुनें</label>
            <select
              name="locType"
              value={editLocType}
              onChange={(e) => {
                setEditLocType(e.target.value);
                setEditDistrictId('');
                setEditSamitiId('');
                setSelectedEditId('');
              }}
              className={selectClass}
              required
            >
              <option value="">-- श्रेणी चुनें --</option>
              <option value="tehsil">तहसील (Tehsil)</option>
              <option value="samiti">पंचायत समिति (Samiti)</option>
              <option value="gp">ग्राम पंचायत (GP)</option>
              <option value="samitiWard">समिति वार्ड (Samiti Ward)</option>
              <option value="zilaWard">जिला परिषद वार्ड (Zila Ward)</option>
            </select>
          </div>

          {/* जिला चयन (यदि आवश्यक हो) */}
          {(editLocType === 'tehsil' || editLocType === 'samiti' || editLocType === 'gp' || editLocType === 'samitiWard' || editLocType === 'zilaWard') && (
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">2. जिला चुनें</label>
              <select
                value={editDistrictId}
                onChange={(e) => {
                  setEditDistrictId(e.target.value);
                  setEditSamitiId('');
                  setSelectedEditId('');
                }}
                className={selectClass}
                required
              >
                <option value="">-- जिला चुनें --</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.nameHi}</option>)}
              </select>
            </div>
          )}

          {/* पंचायत समिति चयन (यदि ग्राम पंचायत या समिति वार्ड हो) */}
          {(editLocType === 'gp' || editLocType === 'samitiWard') && (
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">3. पंचायत समिति चुनें</label>
              <select
                value={editSamitiId}
                onChange={(e) => {
                  setEditSamitiId(e.target.value);
                  setSelectedEditId('');
                }}
                disabled={!editDistrictId}
                className={`${selectClass} disabled:bg-gray-100`}
                required
              >
                <option value="">-- पंचायत समिति चुनें --</option>
                {samitis.map((s) => <option key={s.id} value={s.id}>{s.nameHi}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* वास्तविक स्थान का चयन (Dropdown) */}
          <div>
            <label className="block text-[11px] font-bold text-amber-900 mb-1">सुधारने के लिए स्थान चुनें</label>
            <select
              name="locId"
              value={selectedEditId}
              onChange={(e) => setSelectedEditId(e.target.value)}
              className={selectClass}
              required
            >
              <option value="">-- पहले ऊपर दिए विकल्प चुनें --</option>
              {editItemList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.wardNo ? `वार्ड सं. ${item.wardNo} - ` : ''}{item.nameHi}
                </option>
              ))}
            </select>
          </div>

          {/* नया सही नाम */}
          <div>
            <label className="block text-[11px] font-bold text-amber-900 mb-1">नया सही हिंदी नाम</label>
            <input
              type="text"
              name="nameHi"
              placeholder="जैसे: नया सही नाम"
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="rounded-xl bg-amber-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-800"
          >
            ✏️ नाम अपडेट करें
          </button>
        </div>
      </form>
    </div>
  );
}