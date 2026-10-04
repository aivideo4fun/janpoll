import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'राजस्थान पंचायती राज आम चुनाव 2026 - विस्तृत चरणवार कार्यक्रम और पंचायत समिति वार सूची',
  description: 'राज्य निर्वाचन आयोग, राजस्थान द्वारा घोषित पंचायतीराज संस्थाओं के आम चुनाव 2026 का सम्पूर्ण कार्यक्रम, चरणवार तिथियां, जिला और पंचायत समिति वार सूची।',
  keywords: ['rajasthan panchayati raj election 2026', 'sarpanch chunav rajasthan', 'sec rajasthan election schedule', 'janpoll election update'],
};

// ---------- डेटा स्ट्रक्चर (आधिकारिक आदेशानुसार) ----------
type PhaseId = 1 | 2 | 3 | 4;

type Phase = {
  id: PhaseId;
  name: string;
  samitiNomination: { loksuchna: string; lastDate: string; scrutiny: string; withdrawal: string; symbols: string };
  pollingPartyDeparture: string;
  zpPsVoting: string;
  panchSarpanch: { loksuchna: string; nominationDay: string; voting: string; counting: string; upsarpanch: string };
  gramPanchayats: number;
  booths: number;
};

const PHASES: Phase[] = [
  {
    id: 1,
    name: 'प्रथम चरण',
    samitiNomination: { loksuchna: '08-10-2026', lastDate: '13-10-2026', scrutiny: '14-10-2026', withdrawal: '15-10-2026', symbols: '15-10-2026' },
    pollingPartyDeparture: '22-10-2026',
    zpPsVoting: '22-10-2026 व 23-10-2026',
    panchSarpanch: { loksuchna: '08-10-2026', nominationDay: '24-10-2026', voting: '25-10-2026', counting: '25-10-2026', upsarpanch: '26-10-2026' },
    gramPanchayats: 3672,
    booths: 10857,
  },
  {
    id: 2,
    name: 'द्वितीय चरण',
    samitiNomination: { loksuchna: '13-10-2026', lastDate: '16-10-2026', scrutiny: '17-10-2026', withdrawal: '19-10-2026', symbols: '19-10-2026' },
    pollingPartyDeparture: '28-10-2026',
    zpPsVoting: '28-10-2026 व 29-10-2026',
    panchSarpanch: { loksuchna: '13-10-2026', nominationDay: '30-10-2026', voting: '31-10-2026', counting: '31-10-2026', upsarpanch: '01-11-2026' },
    gramPanchayats: 3626,
    booths: 11763,
  },
  {
    id: 3,
    name: 'तृतीय चरण',
    samitiNomination: { loksuchna: '19-10-2026', lastDate: '23-10-2026', scrutiny: '24-10-2026', withdrawal: '26-10-2026', symbols: '26-10-2026' },
    pollingPartyDeparture: '03-11-2026',
    zpPsVoting: '03-11-2026 व 04-11-2026',
    panchSarpanch: { loksuchna: '19-10-2026', nominationDay: '05-11-2026', voting: '06-11-2026', counting: '06-11-2026', upsarpanch: '07-11-2026' },
    gramPanchayats: 3605,
    booths: 11566,
  },
  {
    id: 4,
    name: 'चतुर्थ चरण',
    samitiNomination: { loksuchna: '31-10-2026', lastDate: '04-11-2026', scrutiny: '05-11-2026', withdrawal: '06-11-2026', symbols: '06-11-2026' },
    pollingPartyDeparture: '13-11-2026',
    zpPsVoting: '14-11-2026',
    panchSarpanch: { loksuchna: '31-10-2026', nominationDay: '15-11-2026', voting: '16-11-2026', counting: '16-11-2026', upsarpanch: '17-11-2026' },
    gramPanchayats: 3500,
    booths: 11198,
  },
];

type DistrictDetail = {
  no: number;
  name: string;
  samitisCount: number;
  gramPanchayats: number;
  phaseBreakdown: { phaseName: string; samitis: string[] }[];
  note?: string;
};

// जिलेवार पंचायत समितियों की चरणवार विस्तृत सूची (परिशिष्ट-B)
const DISTRICT_DETAILS: DistrictDetail[] = [
  {
    no: 1,
    name: 'अजमेर',
    samitisCount: 10,
    gramPanchayats: 261,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['सरवाड़', 'सावर', 'पीसांगन', 'श्रीनगर', 'अजमेर ग्रामीण (आंशिक)'] },
      { phaseName: 'द्वितीय चरण', samitis: ['बड़ल्या', 'सिलोरा', 'अजमेर ग्रामीण (आंशिक)', 'अंराई', 'भिनाय', 'मसूदा'] }
    ],
    note: 'अजमेर ग्रामीण पंचायत समिति आंशिक रूप से दोनों चरणों में विभाजित है।'
  },
  {
    no: 2,
    name: 'ब्यावर',
    samitisCount: 7,
    gramPanchayats: 216,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['जवाजा', 'जैतारण', 'रायपुर', 'बदनौर'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['मांगरोल', 'अंता', 'शाहबाद'] }
    ]
  },
  {
    no: 3,
    name: 'अलवर',
    samitisCount: 11,
    gramPanchayats: 390,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['रामगढ़', 'कठूमर', 'खेड़ली', 'गोविन्दगढ़', 'मुबारकपुर', 'रेणी'] },
      { phaseName: 'द्वितीय चरण', samitis: ['उमरेण', 'मालाखेड़ा', 'लक्ष्मणगढ़', 'राजगढ़', 'थानागाजी'] }
    ]
  },
  {
    no: 4,
    name: 'खैरथल–तिजारा',
    samitisCount: 6,
    gramPanchayats: 180,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['किशनगढ़बास', 'तिजारा'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['मुण्डावर', 'कोटकासिम', 'टपूकड़ा', 'ततारपुर'] }
    ]
  },
  {
    no: 5,
    name: 'बांसवाड़ा',
    samitisCount: 16,
    gramPanchayats: 549,
    phaseBreakdown: [
      { phaseName: 'द्वितीय चरण', samitis: ['घाटोल', 'बागीदौरा', 'कुशलगढ़', 'गनोड़ा'] },
      { phaseName: 'तृतीय चरण', samitis: ['छोटी सरवन', 'आनंदपुरी', 'तलवाड़ा', 'नाहरपुरा'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['गढ़ी', 'अरथुना', 'गांगतलाई', 'सज्जनगढ़', 'छोटी सरवां'] }
    ]
  },
  {
    no: 6,
    name: 'बारां',
    samitisCount: 10,
    gramPanchayats: 280,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['नाहरगढ़', 'अटरू', 'छीपाबड़ौद', 'अंता', 'शाहबाद', 'मांगरोल'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['बारां', 'किशनगंज', 'छबड़ा'] }
    ]
  },
  {
    no: 7,
    name: 'बाड़मेर',
    samitisCount: 17,
    gramPanchayats: 625,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['बायतु', 'आडेल', 'भीयाड़', 'मागता', 'गडरारोड', 'रामसर', 'चौहटन', 'लीलसर', 'संज्या', 'फागलिया'] },
      { phaseName: 'द्वितीय चरण', samitis: ['शिव', 'बाड़मेर', 'बाड़मेर ग्रामीण', 'नागा का तला', 'विशालर', 'सुंदरा'] }
    ]
  },
  {
    no: 8,
    name: 'बालोतरा',
    samitisCount: 11,
    gramPanchayats: 448,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['सिणधरी', 'गिड़ा', 'कल्याणपुर', 'गुड़ामालानी', 'धोरीमन्ना', 'समदड़ी'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['बालोतरा', 'पादरू', 'पायला कला', 'पाटोदी', 'सिवाना'] }
    ]
  },
  {
    no: 9,
    name: 'भरतपुर',
    samitisCount: 7,
    gramPanchayats: 252,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['बयाना', 'नदबई', 'भुसावर', 'रूपवास'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['सेवर', 'उच्चैन', 'चिकसाणा'] }
    ]
  },
  {
    no: 10,
    name: 'डीग',
    samitisCount: 5,
    gramPanchayats: 220,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['कामा', 'पहाड़ी', 'नगर'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['कुम्हेर', 'डीडवाना'] }
    ]
  },
  {
    no: 11,
    name: 'भीलवाड़ा',
    samitisCount: 16,
    gramPanchayats: 511,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['कोटड़ी', 'जहाजपुर', 'खजूरी', 'मांडलगढ़', 'बिजोलिया', 'मांडलगढ़', 'आसींद', 'शंभूपढ़', 'करड़ा'] },
      { phaseName: 'द्वितीय चरण', samitis: ['रायपुर', 'सहाड़ा', 'शाहपुरा', 'फुलियाकलां', 'हुरड़ा', 'सुवाणा', 'बनेड़ा'] }
    ]
  },
  {
    no: 12,
    name: 'बीकानेर',
    samitisCount: 15,
    gramPanchayats: 453,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['नोखा', 'पादरू', 'जसरासर', 'खाजूवाला', 'पूगल', 'छतरगढ़', 'ऋणिया'] },
      { phaseName: 'द्वितीय चरण', samitis: ['डूंगरगढ़', 'बीठनोक', 'लूणकरणसर', 'कोलायत', 'बीकानेर'] }
    ]
  },
  {
    no: 13,
    name: 'बूंदी',
    samitisCount: 8,
    gramPanchayats: 235,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['तालेड़ा'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['बूंदी', 'खटकड़', 'दत्ताता', 'हिंडोली', 'नैनवां', 'लाखेरी', 'केशवरायपाटन'] }
    ]
  },
  {
    no: 14,
    name: 'चित्तौड़गढ़',
    samitisCount: 11,
    gramPanchayats: 359,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['चित्तौड़गढ़', 'भदेसर', 'कपासन', 'राशमी', 'भूपालसागर'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['भैंसरोडगढ़', 'गंगरार', 'निम्बाहेड़ा', 'डूلا', 'बेगूं'] }
    ]
  },
  {
    no: 15,
    name: 'चूरू',
    samitisCount: 13,
    gramPanchayats: 478,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['बीदासर', 'राजगढ़', 'चांदगोठी', 'सिद्धमुख', 'भादरा', 'सरदारशहर', 'सरदारशहर पूर्व'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['सुजानगढ़', 'तारानगर पूर्व', 'तारानगर पश्चिम', 'रतनगढ़', 'सरदारशहर उत्तर'] }
    ]
  },
  {
    no: 16,
    name: 'दौसा',
    samitisCount: 14,
    gramPanchayats: 362,
    phaseBreakdown: [
      { phaseName: 'द्वितीय चरण', samitis: ['मनोहरपुर सोडला', 'महवा', 'मंडावर', 'बांदीकुई', 'बसवा', 'वैजूपाला'] },
      { phaseName: 'तृतीय चरण', samitis: ['लालसोट', 'शिवसिंहपुरा', 'रामगढ़ पचवारा', 'दौसा', 'सिकंदरा', 'सिकराय', 'नांगल राजावतान'] }
    ]
  },
  {
    no: 17,
    name: 'धौलपुर',
    samitisCount: 6,
    gramPanchayats: 224,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['धौलपुर', 'बसेड़ी', 'सैपऊ'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['राजाखेड़ा', 'सरमथुरा'] }
    ]
  },
  {
    no: 18,
    name: 'डूंगरपुर',
    samitisCount: 14,
    gramPanchayats: 442,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['सागवाड़ा', 'पाड़वा', 'गलियाकोट', 'सीमलवाड़ा', 'झौधरी', 'भंडारी', 'चिखली'] },
      { phaseName: 'द्वितीय चरण', samitis: ['डूंगरपुर', 'पालदेवल', 'विधीवाड़ा', 'गामडी अहाड़ा', 'साबला', 'आसपुर', 'दोवड़ा'] }
    ]
  },
  {
    no: 19,
    name: 'हनुमानगढ़',
    samitisCount: 10,
    gramPanchayats: 325,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['हनुमानगढ़ जंक्शन', 'पीलीबंगा', 'नोहर', 'पल्लू', 'भादरा'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['संगरिया', 'रावतसर', 'टिब्बी', 'हनुमानगढ़ टाउन', 'राजपुरा'] }
    ]
  },
  {
    no: 20,
    name: 'जयपुर',
    samitisCount: 22,
    gramPanchayats: 597,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['गोविन्दगढ़', 'धोमू', 'किशनगढ़ रेनवाल', 'जोबनेर', 'झोटवाड़ा', 'सांभरलेक', 'दूदू', 'मौजाबाद'] },
      { phaseName: 'द्वितीय चरण', samitis: ['आमेर', 'जालसु', 'रामपुरा डाबड़ी', 'शाहपुरा', 'अमरसर'] },
      { phaseName: 'तृतीय चरण', samitis: ['फागी', 'माधोराजपुरा', 'जामवारामगढ़', 'कोटखावदा', 'सांगानेर'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['आंधी', 'चाकसू', 'बस्सी', 'तूंगा'] }
    ]
  },
  {
    no: 21,
    name: 'कोटपूतली–बहरोड़',
    samitisCount: 8,
    gramPanchayats: 238,
    phaseBreakdown: [
      { phaseName: 'द्वितीय चरण', samitis: ['नारायणपुर', 'कोटपूतली', 'मानसूर', 'पावटा'] },
      { phaseName: 'तृतीय चरण', samitis: ['नीमराना', 'विराटनगर', 'मैड कुण्डला', 'बहरोड़'] }
    ]
  },
  {
    no: 22,
    name: 'जैसलमेर',
    samitisCount: 10,
    gramPanchayats: 266,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['राजमथाई', 'साकड़ा', 'मणिियाणा', 'खुहड़ी', 'फतेहगढ़', 'रामगढ़', 'जैसलमेर', 'पोकरण', 'नाचना', 'सोहनगढ़'] }
    ]
  },
  {
    no: 23,
    name: 'जालोर',
    samitisCount: 14,
    gramPanchayats: 433,
    phaseBreakdown: [
      { phaseName: 'द्वितीय चरण', samitis: ['भीनमाल', 'जसवंतपुरा', 'सायला', 'आहोर', 'भाद्राजून', 'जालोर', 'उम्मेदाबाद'] },
      { phaseName: 'तृतीय चरण', samitis: ['सांचौर', 'चितलवाना', 'बागोड़ा', 'सरनाऊ'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['रानीवाड़ा', 'बागाड़ी'] }
    ]
  },
  {
    no: 24,
    name: 'झालावाड़',
    samitisCount: 8,
    gramPanchayats: 270,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['भवानीमंडी', 'डग', 'अकलेरा', 'मनोहरथाना'] },
      { phaseName: 'द्वितीय चरण', samitis: ['झालरापाटन', 'पिड़ावा', 'बकानी', 'खानपुर'] }
    ]
  },
  {
    no: 25,
    name: 'झुंझुनूं',
    samitisCount: 14,
    gramPanchayats: 389,
    phaseBreakdown: [
      { phaseName: 'द्वितीय चरण', samitis: ['नवलगढ़', 'चिड़ावा', 'सूरजगढ़', 'सिधाना', 'पिलानी', 'बुहाना'] },
      { phaseName: 'तृतीय चरण', samitis: ['गोठड़ा', 'उदयपुरवाटी', 'गुढ़ागौड़जी'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['खेतड़ी', 'मलसीसर', 'अलसीसर'] }
    ]
  },
  {
    no: 26,
    name: 'जोधपुर',
    samitisCount: 23,
    gramPanchayats: 649,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['शेरगढ़', 'चावा', 'बालेसर', 'आगोलाई', 'शेखाला', 'संतरावा'] },
      { phaseName: 'द्वितीय चरण', samitis: ['ओसियां', 'सामराऊ', 'तिंवरी', 'उम्मेदनगर', 'बावड़ी', 'हटुंडी', 'भोपालगढ़', 'आसोप', 'पीपाड़ शहर', 'सालवा खुर्द', 'लूणी', 'बिलाड़ा', 'कापरडा', 'केरू', 'अंतर'] }
    ]
  },
  {
    no: 27,
    name: 'फलोदी',
    samitisCount: 9,
    gramPanchayats: 305,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['फलोदी', 'बाप', 'घंटियाली', 'लोहावट', 'देचू', 'सेतरावा', 'पीलवा', 'अरऊ', 'बापिणी'] }
    ]
  },
  {
    no: 28,
    name: 'करौली',
    samitisCount: 11,
    gramPanchayats: 309,
    phaseBreakdown: [
      { phaseName: 'द्वितीय चरण', samitis: ['नादौती', 'मासलपुर', 'करौली'] },
      { phaseName: 'तृतीय चरण', samitis: ['हिंडौन', 'श्रीमहावीरजी', 'शेरपुर सुइया'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['मंडरायल', 'कुडगांव', 'सपोटरा', 'बालघाट', 'टोडाभीम'] }
    ]
  },
  {
    no: 29,
    name: 'कोटा',
    samitisCount: 6,
    gramPanchayats: 210,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['लाडपुरा', 'संगोद', 'सुल्तानपुर', 'इटावा'] },
      { phaseName: 'द्वितीय चरण', samitis: ['दीगोद', 'खैराबाद'] }
    ]
  },
  {
    no: 30,
    name: 'नागौर',
    samitisCount: 12,
    gramPanchayats: 347,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['नागौर', 'श्रीबालाजी-अलाय', 'खींवसर', 'पांचौड़ी', 'जायल', 'डीडवाना', 'दीत'] },
      { phaseName: 'द्वितीय चरण', samitis: ['रियाबड़ी', 'मेड़ता सिटी', 'मेड़ता रोड-गोटन', 'डेगाना', 'मूण्डवा (आंशिक)'] }
    ],
    note: 'मूण्डवा पंचायत समिति आंशिक रूप से विभाजित है।'
  },
  {
    no: 31,
    name: 'डीडवाना–कुचामन',
    samitisCount: 9,
    gramPanchayats: 298,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['मकराना', 'मीलवा', 'परबतसर', 'डीडवाना', 'मीलासर'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['कुचामन सिटी', 'ईटावा बामनिया'] }
    ]
  },
  {
    no: 32,
    name: 'पाली',
    samitisCount: 9,
    gramPanchayats: 303,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['मारवाड़ जंक्शन', 'सोजत', 'बमंडी', 'सुमेरपुर', 'रानी'] },
      { phaseName: 'द्वितीय चरण', samitis: ['बाली', 'देसूरी', 'पाली', 'रोहट'] }
    ]
  },
  {
    no: 33,
    name: 'प्रतापगढ़',
    samitisCount: 8,
    gramPanchayats: 277,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['छोटीसादड़ी', 'धमोत्तर', 'धरियावद', 'दलौट'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['प्रतापगढ़', 'अरनोद', 'पीपलखूंट', 'सुहागपुरा'] }
    ]
  },
  {
    no: 34,
    name: 'राजसमंद',
    samitisCount: 9,
    gramPanchayats: 280,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['खमनोर', 'देवगढ़', 'आमेट', 'चारभुजा', 'कुंभलगढ़'] },
      { phaseName: 'द्वितीय चरण', samitis: ['भीम', 'राजसमंद', 'रेलमगरा'] }
    ]
  },
  {
    no: 35,
    name: 'सवाई माधोपुर',
    samitisCount: 8,
    gramPanchayats: 262,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['बामनवास', 'मलारनाडूंगर', 'बोली', 'खंडार'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['सवाई माधोपुर', 'चौथ का बरवाड़ा', 'गंगापुरसिटी', 'वजीरपुर'] }
    ]
  },
  {
    no: 36,
    name: 'सीकर',
    samitisCount: 16,
    gramPanchayats: 449,
    phaseBreakdown: [
      { phaseName: 'द्वितीय चरण', samitis: ['धोद', 'रामगढ़ शेखावाटी', 'श्रीमाधोपुर', 'अजीतगढ़', 'खंडेला', 'पिपराली'] },
      { phaseName: 'तृतीय चरण', samitis: ['फतेहपुर', 'दातारामगढ़', 'लक्ष्मणगढ़', 'पलसाना', 'खाचरियावास'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['नीमकाथाना', 'बासय'] }
    ]
  },
  {
    no: 37,
    name: 'सिरोही',
    samitisCount: 8,
    gramPanchayats: 223,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['शिवगंज', 'कालंदी', 'मंडार', 'आबूरोड'] },
      { phaseName: 'द्वितीय चरण', samitis: ['स्वदर', 'भावरी', 'पिंडवाड़ा', 'सिरोही'] }
    ]
  },
  {
    no: 38,
    name: 'श्रीगंगानगर',
    samitisCount: 11,
    gramPanchayats: 409,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['श्रीविजयनगर', 'सूरतगढ़', 'राजियासर'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['श्रीगंगानगर उत्तर', 'श्रीगंगानगर दक्षिण', 'सादुलशहर', 'अनूपगढ़', 'घड़साना', 'रायसिंहनगर', 'श्रीकरणपुर', 'पदमपुर'] }
    ]
  },
  {
    no: 39,
    name: 'टोंक',
    samitisCount: 8,
    gramPanchayats: 282,
    phaseBreakdown: [
      { phaseName: 'तृतीय चरण', samitis: ['पीपलू', 'परचुर', 'मालपुरा (आशिक)', 'देवली', 'उनियारा'] },
      { phaseName: 'चतुर्थ चरण', samitis: ['निवाई', 'टोंक', 'टोडारायसिंह'] }
    ],
    note: 'मालपुरा पंचायत समिति आंशिक रूप से विभाजित है।'
  },
  {
    no: 40,
    name: 'उदयपुर',
    samitisCount: 20,
    gramPanchayats: 590,
    phaseBreakdown: [
      { phaseName: 'प्रथम चरण', samitis: ['झाड़ोल', 'फलासिया', 'कांगणा', 'गिर्वा', 'नाई', 'मावली', 'घासा', 'वल्लभनगर', 'भूपालपुरा'] },
      { phaseName: 'द्वितीय चरण', samitis: ['गोगुंदा', 'सायरा', 'बड़गांव', 'कोटड़ा', 'देवला', 'सुलाव'] },
      { phaseName: 'तृतीय चरण', samitis: ['लसाड़िया', 'झल्लारा', 'जयसमंद', 'सेमारी'] }
    ]
  },
  {
    no: 41,
    name: 'सलूंबर',
    samitisCount: 7,
    gramPanchayats: 207,
    phaseBreakdown: [
      { phaseName: 'चतुर्थ चरण', samitis: ['सलूंबर', 'सींगला', 'अन्य संबद्ध समितियां'] }
    ]
  },
];

export default function ElectionDetailsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition">
          ← होमपेज पर वापस जाएं
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-3xl p-6 md:p-10 mb-8 shadow-md text-center">
        <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
          राज्य निर्वाचन आयोग, राजस्थान - आधिकारिक विस्तृत विवरण
        </span>
        <h1 className="text-2xl md:text-4xl font-black mt-3 mb-2 tracking-tight">
          पंचायतीराज संस्थाओं के आम चुनाव, 2026 (सम्पूर्ण कार्यक्रम)
        </h1>
        <p className="text-emerald-100 text-xs md:text-sm max-w-xl mx-auto">
          "एक राज्य एक चुनाव" की परिकल्पना के तहत राजस्थान में 41 जिला परिषदों, 457 पंचायत समितियों और 14,403 ग्राम पंचायतों के चरणवार चुनाव की विस्तृत जानकारी[cite: 6]।
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8 bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-sm">
        
        {/* Overview Stats */}
        <div>
          <h2 className="text-xl md:text-2xl font-black text-emerald-900 mb-3 border-b pb-2">
            📊 प्रमुख चुनाव आंकड़े एक नजर में
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-4">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
              <div className="text-lg font-black text-emerald-800">4,03,07,308</div>
              <div className="text-xs text-gray-600 mt-1">👥 कुल मतदाता[cite: 7]</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
              <div className="text-lg font-black text-emerald-800">45,384</div>
              <div className="text-xs text-gray-600 mt-1">🗳️ कुल मतदान केंद्र[cite: 7]</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
              <div className="text-lg font-black text-emerald-800">457</div>
              <div className="text-xs text-gray-600 mt-1">🏛️ पंचायत समितियां[cite: 6]</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
              <div className="text-lg font-black text-emerald-800">14,403</div>
              <div className="text-xs text-gray-600 mt-1">📍 ग्राम पंचायतें[cite: 6]</div>
            </div>
          </div>
        </div>

        {/* 1. PANCH / SARPANCH SECTION */}
        <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-200 space-y-4">
          <h2 className="text-xl font-black text-emerald-900 flex items-center gap-2">
            🟢 1. सरपंच एवं पंच चुनाव कार्यक्रम (ग्राम पंचायत स्तर)
          </h2>
          <p className="text-xs md:text-sm text-gray-700">
            ग्राम पंचायत स्तर पर सरपंच और पंच पदों के लिए मतदान <strong>मतपेटी (Ballot Box)</strong> के माध्यम से होता है। प्रत्येक चरण के अंतर्गत सरपंच/पंच के नामांकन, मतदान और मतगणना की तिथियां नीचे दी गई हैं:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm bg-white rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="p-3">चरण</th>
                  <th className="p-3">लोकसूचना तिथि</th>
                  <th className="p-3">नामांकन व प्रतीक आवंटन तिथि</th>
                  <th className="p-3">मतदान तिथि</th>
                  <th className="p-3">मतगणना तिथि</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100">
                {PHASES.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-bold text-emerald-900">{p.name}</td>
                    <td className="p-3">{p.panchSarpanch.loksuchna}</td>
                    <td className="p-3">{p.panchSarpanch.nominationDay}</td>
                    <td className="p-3 font-semibold text-emerald-800">{p.panchSarpanch.voting}</td>
                    <td className="p-3">{p.panchSarpanch.counting} (तुरंत पश्चात)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. PANCHAYAT SAMITI & ZILA PARISHAD SECTION */}
        <div className="bg-blue-50/40 p-6 rounded-2xl border border-blue-200 space-y-4">
          <h2 className="text-xl font-black text-blue-900 flex items-center gap-2">
            🔵 2. पंचायत समिति एवं जिला परिषद सदस्य चुनाव कार्यक्रम (EVM स्तर)
          </h2>
          <p className="text-xs md:text-sm text-gray-700">
            पंचायत समिति सदस्य और जिला परिषद सदस्य के चुनाव <strong>इलेक्ट्रॉनिक वोटिंग मशीन (EVM)</strong> द्वारा कराए जाते हैं। इनके नाम निर्देशन और मतदान की तिथियां इस प्रकार हैं:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm bg-white rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="p-3">चरण</th>
                  <th className="p-3">समिति नामांकन अंतिम तिथि</th>
                  <th className="p-3">मतदान दलों का प्रस्थान</th>
                  <th className="p-3">समिति सदस्य मतदान तिथि</th>
                  <th className="p-3">अंतिम मतगणना (मुख्यालय)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {PHASES.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-bold text-blue-900">{p.name}</td>
                    <td className="p-3">{p.samitiNomination.lastDate}</td>
                    <td className="p-3">{p.pollingPartyDeparture}</td>
                    <td className="p-3 font-semibold text-blue-800">{p.zpPsVoting}</td>
                    <td className="p-3">20-11-2026</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* District-wise Phase & Samiti Specific Distribution Table */}
        <div>
          <h2 className="text-xl md:text-2xl font-black text-emerald-900 mb-3 border-b pb-2">
            🗺️ जिलेवार एवं पंचायत समिति वार चरण सूची (अपनी पंचायत समिति खोजें)
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            हर जिले के अंतर्गत आने वाली सभी पंचायत समितियों के नाम और वे किस चरण में मतदान करेंगी, इसकी पूरी सूची नीचे दी गई है ताकि आप अपनी पंचायत समिति आसानी से ढूंढ सकें:
          </p>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto border border-emerald-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead className="bg-emerald-800 text-white sticky top-0">
                <tr>
                  <th className="p-3 w-12">क्र.सं.</th>
                  <th className="p-3 w-32">जिले का नाम</th>
                  <th className="p-3 w-20">कुल समितियां</th>
                  <th className="p-3 w-24">ग्राम पंचायतें</th>
                  <th className="p-3">पंचायत समितियों के नाम एवं उनके चरण (किस समिति में कब चुनाव है)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 bg-white">
                {DISTRICT_DETAILS.map((d) => (
                  <tr key={d.no} className="hover:bg-emerald-50/50 align-top">
                    <td className="p-3 font-medium text-gray-500">{d.no}</td>
                    <td className="p-3 font-bold text-emerald-900">{d.name}</td>
                    <td className="p-3 font-semibold">{d.samitisCount}</td>
                    <td className="p-3">{d.gramPanchayats}</td>
                    <td className="p-3 text-gray-800 space-y-2">
                      {d.phaseBreakdown.map((pb, idx) => (
                        <div key={idx} className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 flex flex-wrap items-center gap-2">
                          <span className="bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                            {pb.phaseName}
                          </span>
                          <span className="text-gray-700 font-medium">
                            {pb.samitis.join(', ')}
                          </span>
                        </div>
                      ))}
                      {d.note && <span className="block text-[11px] text-amber-700 font-semibold mt-1">*{d.note}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Limit & Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
            <h3 className="text-base font-bold text-emerald-900 mb-2">💰 चुनाव खर्च की अधिकतम सीमा</h3>
            <ul className="text-xs md:text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li><strong>जिला परिषद सदस्य:</strong> ₹3,00,000/-[cite: 10]</li>
              <li><strong>पंचायत समिति सदस्य:</strong> ₹1,50,000/-[cite: 10]</li>
              <li><strong>सरपंच पद हेतु:</strong> ₹1,00,000/-[cite: 10]</li>
            </ul>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
            <h3 className="text-base font-bold text-emerald-900 mb-2">🗳️ मतदान के साधन एवं समय</h3>
            <ul className="text-xs md:text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li><strong>सरपंच/पंच:</strong> मतपेटी (Ballot Box)[cite: 8]</li>
              <li><strong>जिला परिषद/समिति सदस्य:</strong> ईवीएम (EVM)[cite: 8]</li>
              <li><strong>समय:</strong> प्रातः 7:00 बजे से सायं 6:00 बजे तक[cite: 9]</li>
            </ul>
          </div>
        </div>

      </div>

      {/* Footer Call to Action */}
      <div className="mt-8 text-center bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
        <h3 className="text-lg font-bold text-emerald-900 mb-2">अपनी पंचायत का चुनाव रुझान देखें</h3>
        <p className="text-xs text-gray-600 mb-4">अपने क्षेत्र के संभावित सरपंच या वार्ड पंच उम्मीदवारों के पोल देखने या बनाने के लिए होमपेज पर जाएं।</p>
        <Link href="/" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition inline-block shadow">
          होमपेज पर लौटें और वोट करें →
        </Link>
      </div>
    </div>
  );
}