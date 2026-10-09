type SubscriberData = {
  id: string;
  email: string;
  createdAt: Date | string;
};

type SubscribersProps = {
  subscribers: SubscriberData[];
  total: number;
  formatIndiaDateTime: (value: Date | string) => string;
};

export default function Subscribers({ subscribers, total, formatIndiaDateTime }: SubscribersProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-emerald-900 sm:text-base">📧 न्यूज़लेटर सदस्य सूची</h2>
          <p className="mt-1 text-[11px] text-emerald-700">
            कुल {total.toLocaleString('en-IN')} सदस्य पंजीकृत हैं
            {total > subscribers.length ? ` · नीचे नवीनतम ${subscribers.length} दिखाए गए हैं` : ''}
          </p>
        </div>

        <a
          href="/api/admin/subscribers/export"
          download
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
        >
          ⬇️ एक्सेल में डाउनलोड करें (सभी सदस्य)
        </a>
      </div>

      {subscribers.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="text-4xl">📭</div>
          <p className="mt-3 text-sm font-semibold text-gray-500">अभी तक कोई सदस्य पंजीकृत नहीं है।</p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-emerald-100 bg-emerald-50 text-emerald-900">
              <tr>
                <th className="p-3 font-black">क्रम</th>
                <th className="p-3 font-black">ईमेल पता</th>
                <th className="p-3 font-black">सदस्यता की तिथि और समय</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscribers.map((sub, i) => (
                <tr key={sub.id} className="transition hover:bg-emerald-50/30">
                  <td className="p-3 font-bold text-gray-500">{i + 1}</td>
                  <td className="p-3 font-semibold text-gray-800">{sub.email}</td>
                  <td className="p-3 text-gray-500">{formatIndiaDateTime(sub.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}