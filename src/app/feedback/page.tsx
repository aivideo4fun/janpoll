import Link from 'next/link';

export const metadata = {
  title: 'सुझाव या शिकायत — JanPoll',
  description: 'अपने सुझाव या शिकायतें सीधे JanPoll टीम तक पहुंचाएं।',
};

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl bg-white rounded-3xl shadow-sm border border-emerald-100 p-6 sm:p-10 space-y-8">
        
        <div className="border-b border-emerald-100 pb-6">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            प्रतिक्रिया
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-3">
            सुझाव या शिकायत
          </h1>
          <p className="text-xs text-gray-500 mt-1">platform को बेहतर बनाने में हमारी सहायता करें</p>
        </div>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <p>
            यदि आपके पास प्लेटफॉर्म से जुड़ा कोई सुझाव है या किसी प्रकार की शिकायत है, तो आप सीधे हमारे <Link href="/contact" className="text-emerald-700 font-bold underline">संपर्क करें</Link> पेज पर जाकर फॉर्म भर सकते हैं। हमारी टीम आपकी बात पर तुरंत ध्यान देगी।
          </p>
        </div>

        <div className="border-t border-emerald-100 pt-6 text-center">
          <Link href="/" className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow">
            ← होम पेज पर वापस जाएं
          </Link>
        </div>

      </div>
    </main>
  );
}