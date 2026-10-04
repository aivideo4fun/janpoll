import Link from 'next/link';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ district: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  return {
    title: `${district.toUpperCase()} - जिला परिषद सदस्य चुनाव | JanPoll`,
    description: 'जिला परिषद वार्डवार उम्मीदवारों और राजनीतिक दलों के समर्थन के लिए पोल देखें।',
  };
}

export default async function ZilaParishadIndexPage({ params }: Props) {
  const { district } = await params;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6">
        <Link href={`/rajasthan/${district}`} className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition">
          ← जिला श्रेणियों पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-amber-800 to-orange-700 text-white rounded-3xl p-6 md:p-8 mb-8 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          🟠 जिला परिषद सदस्य चुनाव - {district.toUpperCase()}
        </h1>
        <p className="text-amber-100 text-xs md:text-sm">
          जिला परिषद वॉर्ड वार चुनाव और जनता के रुझान यहाँ देखे जा सकते हैं।
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-amber-100 text-center shadow-sm space-y-4">
        <p className="text-sm text-gray-600">
          {district.toUpperCase()} जिले के जिला परिषद वॉर्डों के लिए उम्मीदवार अपने क्षेत्र का पोल बना सकते हैं।
        </p>
        <Link href={`/create?district=${district}&category=zila-parishad`} className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition inline-block shadow">
          ＋ जिला परिषद वॉर्ड का पोल बनाएँ
        </Link>
      </div>
    </div>
  );
}