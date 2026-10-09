import Link from 'next/link';

type SubscriberData = {
  id: string;
  email: string;
  createdAt: Date | string;
};

type SubscribersProps = {
  subscribers: SubscriberData[];
  total: number;
  showAll: boolean;
  formatIndiaDateTime: (value: Date | string) => string;
};

export default function Subscribers({
  subscribers,
  total,
  showAll,
  formatIndiaDateTime,
}: SubscribersProps) {
  const isPartial = !showAll && total > subscribers.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs text-gray-600">
          कुल <strong className="text-gray-900">{total.toLocaleString('en-IN')}</strong> सदस्य पंजीकृत हैं ·{' '}
          {showAll
            ? 'सभी सदस्य नीचे दिखाए गए हैं'
            : isPartial
            ? `नवीनतम ${subscribers.length} नीचे दिखाए गए हैं`
            : 'सभी सदस्य नीचे दिखाए गए हैं'}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {isPartial && (
            <Link
              href="/admin?subs=all"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              👁️ सभी {total.toLocaleString('en-IN')} सदस्य दिखाएं
            </Link>
          )}

          {showAll && (
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
            >
              केवल नवीनतम दिखाएं
            </Link>
          )}

          <a
            href="/api/admin/subscribers/export"
            download
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            ⬇️ एक्सेल में डाउनलोड करें (सभी {total.toLocaleString('en-IN')} सदस्य)
          </a>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="text-4xl">📭</div>
          <p className="mt-3 text-sm font-semibold text-gray-500">अभी तक कोई सदस्य पंजीकृत नहीं है।</p>
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-gray-700">
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
      )}
    </div>
  );
}