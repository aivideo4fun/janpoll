import type { CoverageData } from '@/lib/coverage';

const nf = (n: number) => n.toLocaleString('en-IN');
const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

export default function CoverageAnalytics({ data }: { data: CoverageData }) {
  const { totals, rows, unmappedIds } = data;
  const coverage = pct(totals.gpWithRunning, totals.totalGp);
  const noPoll = totals.totalGp - totals.gpWithRunning;

  const cards = [
    { label: 'कुल पंचायतें (डेटा में)', value: nf(totals.totalGp), tone: 'bg-slate-50 border-slate-200 text-slate-900' },
    {
      label: 'चालू पोल वाली पंचायतें',
      value: `${nf(totals.gpWithRunning)} (${coverage}%)`,
      tone: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    },
    { label: 'कभी पोल बना', value: nf(totals.gpWithAny), tone: 'bg-blue-50 border-blue-200 text-blue-900' },
    { label: 'चालू पोल के बिना पंचायतें', value: nf(noPoll), tone: 'bg-red-50 border-red-200 text-red-900' },
    {
      label: 'पंचायत समितियाँ / ZP वार्ड (डेटा)',
      value: `${nf(totals.samitis)} / ${nf(totals.wards)}`,
      tone: 'bg-slate-50 border-slate-200 text-slate-900',
    },
    {
      label: 'बिना पंचायत वाले पोल',
      value: nf(unmappedIds.length),
      tone: 'bg-amber-50 border-amber-200 text-amber-900',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border p-4 text-center ${c.tone}`}>
            <p className="text-xl font-black sm:text-2xl">{c.value}</p>
            <p className="mt-1 text-[11px] font-semibold opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-600">
          चालू पोल = सक्रिय और अवधि के भीतर। गिनती केवल उन पंचायतों की है जो डेटाबेस में जोड़ी जा चुकी हैं।
        </p>
        <a
          href="/api/admin/panchayats/export"
          download
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
        >
          ⬇️ सभी पंचायतों की स्थिति (Excel)
        </a>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
            <tr>
              <th className="p-3 font-black">जिला</th>
              <th className="p-3 font-black">पंचायतें</th>
              <th className="p-3 font-black">चालू पोल वाली</th>
              <th className="p-3 font-black">कवरेज</th>
              <th className="p-3 font-black">कभी पोल बना</th>
              <th className="p-3 font-black">चालू पोल</th>
              <th className="p-3 font-black">समितियाँ</th>
              <th className="p-3 font-black">ZP वार्ड</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const p = pct(r.gpWithRunning, r.totalGp);
              return (
                <tr key={r.id} className="transition hover:bg-emerald-50/30">
                  <td className="p-3 font-bold text-gray-900">{r.nameHi}</td>
                  <td className="p-3 text-gray-700">{r.totalGp === 0 ? <span className="text-amber-700">डेटा खाली</span> : nf(r.totalGp)}</td>
                  <td className="p-3 font-semibold text-emerald-800">{nf(r.gpWithRunning)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, p)}%` }} />
                      </div>
                      <span className="font-bold text-gray-700">{p}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-700">{nf(r.gpWithAny)}</td>
                  <td className="p-3 text-gray-700">{nf(r.runningPolls)}</td>
                  <td className="p-3">{r.samitis === 0 ? <span className="font-semibold text-amber-700">⚠ खाली</span> : nf(r.samitis)}</td>
                  <td className="p-3">{r.wards === 0 ? <span className="font-semibold text-amber-700">⚠ खाली</span> : nf(r.wards)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
