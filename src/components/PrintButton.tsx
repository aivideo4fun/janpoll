'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-emerald-800"
    >
      <span>🖨️</span> प्रिंट / डाउनलोड करें
    </button>
  );
}