'use client';

import { useEffect, useState } from 'react';

type Item = { id: string; nameHi: string; nameEn?: string };

type LocationPickerProps = {
  districts: Item[];
  depth: 'district' | 'samiti' | 'gp';
  /** true हो तो समिति और पंचायत वैकल्पिक रहेंगे */
  partial?: boolean;
};

const selectClass =
  'w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400';

export default function LocationPicker({ districts, depth, partial = false }: LocationPickerProps) {
  const [districtId, setDistrictId] = useState('');
  const [samitiId, setSamitiId] = useState('');
  const [samitis, setSamitis] = useState<Item[]>([]);
  const [gps, setGps] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSamitiId('');
    setSamitis([]);
    setGps([]);
    setLoaded(false);
    if (!districtId || depth === 'district') return;

    let cancelled = false;
    fetch(`/api/admin/locations?districtId=${encodeURIComponent(districtId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setSamitis(d.items ?? []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSamitis([]);
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [districtId, depth]);

  useEffect(() => {
    setGps([]);
    if (!samitiId || depth !== 'gp') return;

    let cancelled = false;
    fetch(`/api/admin/locations?samitiId=${encodeURIComponent(samitiId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setGps(d.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setGps([]);
      });

    return () => {
      cancelled = true;
    };
  }, [samitiId, depth]);

  const cols = depth === 'gp' ? 'md:grid-cols-3' : depth === 'samiti' ? 'md:grid-cols-2' : '';

  return (
    <div>
      <div className={`grid gap-3 ${cols}`}>
        <select
          name="districtId"
          required
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          className={selectClass}
        >
          <option value="">जिला चुनें</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nameHi}
            </option>
          ))}
        </select>

        {depth !== 'district' && (
          <select
            name="samitiId"
            required={!partial}
            disabled={!districtId}
            value={samitiId}
            onChange={(e) => setSamitiId(e.target.value)}
            className={selectClass}
          >
            <option value="">पंचायत समिति चुनें</option>
            {samitis.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameHi}
              </option>
            ))}
          </select>
        )}

        {depth === 'gp' && (
          <select
            name="gramPanchayatId"
            required={!partial}
            disabled={!samitiId}
            className={selectClass}
            defaultValue=""
          >
            <option value="">ग्राम पंचायत चुनें</option>
            {gps.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nameHi}
              </option>
            ))}
          </select>
        )}
      </div>

      {depth !== 'district' && districtId && loaded && samitis.length === 0 && (
        <p className="mt-2 text-[11px] font-semibold text-amber-700">
          इस जिले में अभी कोई पंचायत समिति नहीं जोड़ी गई है। पहले "स्थान डेटा प्रबंधन" से जोड़ें।
        </p>
      )}
    </div>
  );
}