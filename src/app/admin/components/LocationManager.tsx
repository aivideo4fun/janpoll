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
  deleteLocationItem?: (formData: FormData) => Promise<void>;
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
  deleteLocationItem,
}: LocationManagerProps) {
  // 1. Gram Panchayat / Samiti Add Form State
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [samitis, setSamitis] = useState<Samiti[]>([]);
  const [selectedSamitiId, setSelectedSamitiId] = useState('');

  // 2. Name Correction (Edit/Delete) Form State
  const [editLocType, setEditLocType] = useState('');
  const [editDistrictId, setEditDistrictId] = useState('');
  const [editSamitis, setEditSamitis] = useState<Samiti[]>([]);
  const [editSamitiId, setEditSamitiId] = useState('');
  const [editItemList, setEditItemList] = useState<ItemType[]>([]);
  const [selectedEditId, setSelectedEditId] = useState('');

  // Main Form ke liye Samiti fetch karna
  useEffect(() => {
    setSelectedSamitiId('');
    setSamitis([]);
    if (!selectedDistrictId) return;

    fetch(`/api/admin/locations?districtId=${selectedDistrictId}&type=samiti`)
      .then((res) => res.json())
      .then((data) => setSamitis(data.items ?? []))
      .catch((err) => console.error('Samiti fetch error:', err));
  }, [selectedDistrictId]);

  // Edit Form ke liye District change hone par Samiti fetch karna
  useEffect(() => {
    setEditSamitiId('');
    setEditSamitis([]);
    if (!editDistrictId) return;

    fetch(`/api/admin/locations?districtId=${editDistrictId}&type=samiti`)
      .then((res) => res.json())
      .then((data) => setEditSamitis(data.items ?? []))
      .catch((err) => console.error('Edit Samiti fetch error:', err));
  }, [editDistrictId]);

  // Edit Form ke liye items (Tehsil, GP, Ward etc.) load karna
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
        .catch((err) => console.error('Edit item list error:', err));
    } else if (editLocType === 'gp' || editLocType === 'samitiWard') {
      if (!editSamitiId) return;
      let apiType = editLocType === 'gp' ? 'gp' : 'samitiWard';
      fetch(`/api/admin/locations?samitiId=${editSamitiId}&type=${apiType}`)
        .then((res) => res.json())
        .then((data) => setEditItemList(data.items ?? []))
        .catch((err) => console.error('Edit item list error:', err));
    }
  }, [editLocType, editDistrictId, editSamitiId]);

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
        💡 <strong>Nirdesh:</strong> Har pankti me ek naam likhen: <strong>Hindi naam | English name</strong>. Kisi bhi naam me sudhaar karne ya duplicate hatane ke liye niche diye gaye section ka upyog karein.
      </p>

      {/* 1. Panchayat Samiti Jodein */}
      <form action={addSamitis} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏛️ Panchayat Samitiyan Jodein</h3>
        <LocationPicker districts={districts} depth="district" />
        <textarea name="items" required rows={4} placeholder={'Ajmer | Ajmer'} className={textareaClass} />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>+ Samitiyan Jodein</button>
        </div>
      </form>

      {/* 2. Gram Panchayat Jodein */}
      <form action={addGramPanchayats} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏘️ Gram Panchayatein Jodein</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Jila Chunein</label>
            <select value={selectedDistrictId} onChange={(e) => setSelectedDistrictId(e.target.value)} className={selectClass} required>
              <option value="">-- Jila Chunein --</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.nameHi} ({d.nameEn})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Panchayat Samiti Chunein</label>
            <select name="samitiId" value={selectedSamitiId} onChange={(e) => setSelectedSamitiId(e.target.value)} disabled={!selectedDistrictId} className={`${selectClass} disabled:bg-gray-100`} required>
              <option value="">-- Panchayat Samiti Chunein --</option>
              {samitis.map((s) => <option key={s.id} value={s.id}>{s.nameHi}</option>)}
            </select>
          </div>
        </div>
        <textarea name="items" required rows={5} placeholder={'Ramgarh | Ramgarh'} className={textareaClass} />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>+ Panchayatein Jodein</button>
        </div>
      </form>

      {/* 3. Panchayat Samiti Ward Jodein */}
      <form action={addSamitiWards} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🗳️ Panchayat Samiti Ward Jodein</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Jila Chunein</label>
            <select value={selectedDistrictId} onChange={(e) => setSelectedDistrictId(e.target.value)} className={selectClass} required>
              <option value="">-- Jila Chunein --</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.nameHi}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Panchayat Samiti Chunein</label>
            <select name="samitiId" value={selectedSamitiId} onChange={(e) => setSelectedSamitiId(e.target.value)} disabled={!selectedDistrictId} className={`${selectClass} disabled:bg-gray-100`} required>
              <option value="">-- Panchayat Samiti Chunein --</option>
              {samitis.map((s) => <option key={s.id} value={s.id}>{s.nameHi}</option>)}
            </select>
          </div>
        </div>
        <textarea name="items" required rows={4} placeholder={'1 | Ward 1'} className={textareaClass} />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>+ Samiti Ward Jodein</button>
        </div>
      </form>

      {/* 4. Zila Parishad Ward Jodein */}
      <form action={addZilaWards} className={cardClass}>
        <h3 className="text-sm font-black text-gray-900">🏛️ Zila Parishad Ward Jodein</h3>
        <LocationPicker districts={districts} depth="district" />
        <textarea name="items" required rows={4} placeholder={'1 | Ward 1'} className={textareaClass} />
        <div className="flex justify-end">
          <button type="submit" className={buttonClass}>+ Zila Parishad Ward Jodein</button>
        </div>
      </form>

      {/* 5. ✏️ Sthan Ka Naam Sudhaaren aur Delete Karein */}
      <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
        <h3 className="text-sm font-black text-amber-900">✏️ Sthan Ka Naam Sudhaaren ya Delete Karein</h3>
        <p className="text-[11px] text-amber-800">Shreni aur sthan chunakar naya naam update karein ya duplicate/galat sthan ko delete karein.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-amber-900 mb-1">1. Shreni Chunein</label>
            <select
              value={editLocType}
              onChange={(e) => {
                setEditLocType(e.target.value);
                setEditDistrictId('');
                setEditSamitiId('');
                setSelectedEditId('');
              }}
              className={selectClass}
            >
              <option value="">-- Shreni Chunein --</option>
              <option value="tehsil">Tehsil</option>
              <option value="samiti">Panchayat Samiti</option>
              <option value="gp">Gram Panchayat (GP)</option>
              <option value="samitiWard">Samiti Ward</option>
              <option value="zilaWard">Zila Parishad Ward</option>
            </select>
          </div>

          {(editLocType === 'tehsil' || editLocType === 'samiti' || editLocType === 'gp' || editLocType === 'samitiWard' || editLocType === 'zilaWard') && (
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">2. Jila Chunein</label>
              <select
                value={editDistrictId}
                onChange={(e) => {
                  setEditDistrictId(e.target.value);
                  setEditSamitiId('');
                  setSelectedEditId('');
                }}
                className={selectClass}
              >
                <option value="">-- Jila Chunein --</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.nameHi}</option>)}
              </select>
            </div>
          )}

          {(editLocType === 'gp' || editLocType === 'samitiWard') && (
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">3. Panchayat Samiti Chunein</label>
              <select
                value={editSamitiId}
                onChange={(e) => {
                  setEditSamitiId(e.target.value);
                  setSelectedEditId('');
                }}
                disabled={!editDistrictId}
                className={`${selectClass} disabled:bg-gray-100`}
              >
                <option value="">-- Panchayat Samiti Chunein --</option>
                {editSamitis.map((s) => <option key={s.id} value={s.id}>{s.nameHi}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Update Form */}
        <form action={updateLocationName} className="space-y-3 pt-2 border-t border-amber-200">
          <input type="hidden" name="locType" value={editLocType} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">Sudharne Ke Liye Sthan Chunein</label>
              <select
                name="locId"
                value={selectedEditId}
                onChange={(e) => setSelectedEditId(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">-- Sthan Chunein --</option>
                {editItemList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.wardNo ? `Ward No. ${item.wardNo} - ` : ''}{item.nameHi}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-900 mb-1">Naya Sahi Hindi Naam</label>
              <input
                type="text"
                name="nameHi"
                placeholder="Jaise: Naya Sahi Naam"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="rounded-xl bg-amber-700 px-6 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-800"
            >
              ✏️ Naam Update Karein
            </button>
          </div>
        </form>

        {/* Delete Form */}
        {deleteLocationItem && (
          <form 
            action={deleteLocationItem} 
            onSubmit={(e) => {
              if (!confirm('Kya aap wakai is sthan ko delete karna chahte hain?')) {
                e.preventDefault();
              }
            }}
            className="space-y-3 pt-3 border-t border-red-200"
          >
            <input type="hidden" name="locType" value={editLocType} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-red-900 mb-1">Delete Karne Ke Liye Sthan Chunein</label>
                <select
                  name="locId"
                  className={selectClass}
                  required
                >
                  <option value="">-- Delete Karne Ke Liye Sthan Chunein --</option>
                  {editItemList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.wardNo ? `Ward No. ${item.wardNo} - ` : ''}{item.nameHi}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-xl bg-red-600 px-6 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
                >
                  🗑️ Sthan Delete Karein
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}