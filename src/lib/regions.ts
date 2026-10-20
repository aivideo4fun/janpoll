export type Region = {
  code: string;
  slug: string;
  name: string;
  en: string;
  type: 'STATE' | 'UT';
};

export const createElectionHref = (region: Region) =>
  `/create/election?state=${encodeURIComponent(region.slug)}`;
export const REGIONS: Region[] = [
  { code: 'AP', slug: 'andhra-pradesh', name: 'आंध्र प्रदेश', en: 'Andhra Pradesh', type: 'STATE' },
  { code: 'AR', slug: 'arunachal-pradesh', name: 'अरुणाचल प्रदेश', en: 'Arunachal Pradesh', type: 'STATE' },
  { code: 'AS', slug: 'assam', name: 'असम', en: 'Assam', type: 'STATE' },
  { code: 'BR', slug: 'bihar', name: 'बिहार', en: 'Bihar', type: 'STATE' },
  { code: 'CG', slug: 'chhattisgarh', name: 'छत्तीसगढ़', en: 'Chhattisgarh', type: 'STATE' },
  { code: 'GA', slug: 'goa', name: 'गोवा', en: 'Goa', type: 'STATE' },
  { code: 'GJ', slug: 'gujarat', name: 'गुजरात', en: 'Gujarat', type: 'STATE' },
  { code: 'HR', slug: 'haryana', name: 'हरियाणा', en: 'Haryana', type: 'STATE' },
  { code: 'HP', slug: 'himachal-pradesh', name: 'हिमाचल प्रदेश', en: 'Himachal Pradesh', type: 'STATE' },
  { code: 'JH', slug: 'jharkhand', name: 'झारखंड', en: 'Jharkhand', type: 'STATE' },
  { code: 'KA', slug: 'karnataka', name: 'कर्नाटक', en: 'Karnataka', type: 'STATE' },
  { code: 'KL', slug: 'kerala', name: 'केरल', en: 'Kerala', type: 'STATE' },
  { code: 'MP', slug: 'madhya-pradesh', name: 'मध्य प्रदेश', en: 'Madhya Pradesh', type: 'STATE' },
  { code: 'MH', slug: 'maharashtra', name: 'महाराष्ट्र', en: 'Maharashtra', type: 'STATE' },
  { code: 'MN', slug: 'manipur', name: 'मणिपुर', en: 'Manipur', type: 'STATE' },
  { code: 'ML', slug: 'meghalaya', name: 'मेघालय', en: 'Meghalaya', type: 'STATE' },
  { code: 'MZ', slug: 'mizoram', name: 'मिज़ोरम', en: 'Mizoram', type: 'STATE' },
  { code: 'NL', slug: 'nagaland', name: 'नागालैंड', en: 'Nagaland', type: 'STATE' },
  { code: 'OD', slug: 'odisha', name: 'ओडिशा', en: 'Odisha', type: 'STATE' },
  { code: 'PB', slug: 'punjab', name: 'पंजाब', en: 'Punjab', type: 'STATE' },
  { code: 'RJ', slug: 'rajasthan', name: 'राजस्थान', en: 'Rajasthan', type: 'STATE' },
  { code: 'SK', slug: 'sikkim', name: 'सिक्किम', en: 'Sikkim', type: 'STATE' },
  { code: 'TN', slug: 'tamil-nadu', name: 'तमिलनाडु', en: 'Tamil Nadu', type: 'STATE' },
  { code: 'TS', slug: 'telangana', name: 'तेलंगाना', en: 'Telangana', type: 'STATE' },
  { code: 'TR', slug: 'tripura', name: 'त्रिपुरा', en: 'Tripura', type: 'STATE' },
  { code: 'UP', slug: 'uttar-pradesh', name: 'उत्तर प्रदेश', en: 'Uttar Pradesh', type: 'STATE' },
  { code: 'UK', slug: 'uttarakhand', name: 'उत्तराखंड', en: 'Uttarakhand', type: 'STATE' },
  { code: 'WB', slug: 'west-bengal', name: 'पश्चिम बंगाल', en: 'West Bengal', type: 'STATE' },
  { code: 'AN', slug: 'andaman-nicobar', name: 'अंडमान और निकोबार द्वीप समूह', en: 'Andaman and Nicobar Islands', type: 'UT' },
  { code: 'CH', slug: 'chandigarh', name: 'चंडीगढ़', en: 'Chandigarh', type: 'UT' },
  { code: 'DH', slug: 'dadra-nagar-haveli-daman-diu', name: 'दादरा और नगर हवेली व दमन और दीव', en: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UT' },
  { code: 'DL', slug: 'delhi', name: 'दिल्ली', en: 'Delhi', type: 'UT' },
  { code: 'JK', slug: 'jammu-kashmir', name: 'जम्मू और कश्मीर', en: 'Jammu and Kashmir', type: 'UT' },
  { code: 'LA', slug: 'ladakh', name: 'लद्दाख', en: 'Ladakh', type: 'UT' },
  { code: 'LD', slug: 'lakshadweep', name: 'लक्षद्वीप', en: 'Lakshadweep', type: 'UT' },
  { code: 'PY', slug: 'puducherry', name: 'पुडुचेरी', en: 'Puducherry', type: 'UT' },
];

const PRIORITY = ['RJ', 'UP', 'MH', 'BR', 'MP', 'GJ', 'DL'];

export const getRegionByCode = (code?: string | null): Region | undefined =>
  REGIONS.find((r) => r.code === code);

export const getRegionBySlug = (slug?: string | null): Region | undefined =>
  REGIONS.find((r) => r.slug === slug);

export const regionHref = (r: Region) =>
  r.code === 'RJ' ? '/rajasthan' : `/state/${r.slug}`;

export const createHref = (r: Region) => r.code === 'RJ' ? '/create/rajasthan?state=rajasthan' : `/create/public?state=${r.slug}`;

export function rankRegions(counts: Map<string, number>) {
  const rank = (code: string) => {
    const i = PRIORITY.indexOf(code);
    return i === -1 ? 999 : i;
  };
  return [...REGIONS].sort(
    (a, b) =>
      (counts.get(b.code) ?? 0) - (counts.get(a.code) ?? 0) ||
      rank(a.code) - rank(b.code),
  );
}