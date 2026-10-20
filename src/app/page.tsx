import { getTrendingStates } from '@/lib/state-trending';
import { getTodayTopPolls } from '@/lib/home-ranking';
import HomeContent from '@/components/HomeContent';
import Link from 'next/link';
import { isPollOpen } from '@/lib/poll-utils';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { REGIONS } from '@/lib/regions';
import {
  CountUp,
  RegionPicker,
} from '@/components/JanPollHomeClient';

import './janpoll-home.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'पोल बनाएँ और जनता की राय जानें | JanPoll India',
  description:
    'JanPoll India पर नया पोल बनाएँ, अपना सवाल साझा करें और जनता का जनमत जानें। Create a poll and explore public opinion across India, including Rajasthan sarpanch polls.',
  alternates: {
    canonical: 'https://janpoll.in/',
    languages: { 'hi-IN': 'https://janpoll.in/', 'en-IN': 'https://janpoll.in/en', 'x-default': 'https://janpoll.in/' },
  },
  keywords: ['JanPoll India', 'poll', 'create poll', 'new poll', 'vote poll', 'poll banaye', 'sarpanch poll', 'janta ka poll', 'पोल बनाएँ', 'जनता का पोल', 'जनमत'],
  openGraph: {
    title: 'पोल बनाएँ और जनता की राय जानें | JanPoll India',
    description:
      'स्थानीय और राष्ट्रीय मुद्दों पर अपनी राय साझा करें।',
    url: 'https://janpoll.in/',
    siteName: 'JanPoll India',
    locale: 'hi_IN',
    type: 'website',
  },
};

const CATEGORIES = [
  { slug: 'all', label: 'सभी', icon: '◉' },
  { slug: 'politics', label: 'राजनीति', icon: '⚑' },
  { slug: 'elections', label: 'जनमत', icon: '☑' },
  { slug: 'national', label: 'राष्ट्रीय मुद्दे', icon: '◎' },
  { slug: 'local', label: 'स्थानीय मुद्दे', icon: '⌖' },
  { slug: 'sports', label: 'खेल', icon: '◈' },
  { slug: 'entertainment', label: 'मनोरंजन', icon: '✧' },
];

const STEPS = [
  {
    number: '01',
    title: 'अपना सवाल रखें',
    description:
      'एक स्पष्ट सवाल और संतुलित विकल्पों के साथ पोल बनाएँ।',
  },
  {
    number: '02',
    title: 'लोगों को जोड़ें',
    description:
      'पोल का लिंक साझा करें और लोगों को अपनी राय रखने दें।',
  },
  {
    number: '03',
    title: 'जनमत समझें',
    description:
      'दर्ज वोटों के आधार पर परिणाम देखें और चर्चा आगे बढ़ाएँ।',
  },
];

const numbers = new Intl.NumberFormat('en-IN');

async function getHomeData(category: string) {
  const filters: Record<string, Prisma.PollWhereInput> = {
    politics: { OR: [{ topic: 'political' }, { categoryType: 'political' }] },
    elections: { electionType: { in: ['sarpanch', 'samiti', 'zila', 'assembly'] } },
    national: { scope: 'NATIONAL', stateCode: null, districtId: null, districtName: null },
    local: { OR: [{ scope: 'STATE' }, { districtId: { not: null } }, { districtName: { not: null } }] },
    sports: { topic: 'sports' },
    entertainment: { topic: 'entertainment' },
  };

  const results = await Promise.allSettled([
    db.poll.count({
      where: { active: true },
    }),

    db.pollOption.aggregate({
      _sum: { voteCount: true },
    }),

    db.user.count(),

    getTodayTopPolls(filters[category] || {}),

    db.poll.groupBy({
      by: ['stateCode'],
      where: { active: true },
      _count: { _all: true },
    }),
  ] as const);

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `JanPoll homepage query ${index} failed`,
        result.reason,
      );
    }
  });

  const [
    pollCountResult,
    voteCountResult,
    userCountResult,
    pollsResult,
    statesResult,
  ] = results;

  const stateCounts = new Map<string, number>(
    statesResult.status === 'fulfilled'
      ? statesResult.value
          .filter((state) => state.stateCode)
          .map(
            (state) =>
              [
                state.stateCode as string,
                state._count._all,
              ] as [string, number],
          )
      : [],
  );

  return {
    pollCount:
      pollCountResult.status === 'fulfilled'
        ? pollCountResult.value
        : null,

    voteCount:
      voteCountResult.status === 'fulfilled'
        ? voteCountResult.value._sum.voteCount ?? 0
        : null,

    userCount:
      userCountResult.status === 'fulfilled'
        ? userCountResult.value
        : null,

    polls:
      pollsResult.status === 'fulfilled'
        ? pollsResult.value
        : [],

    pollsFailed: pollsResult.status === 'rejected',

    stateCounts,

    statesLoaded: statesResult.status === 'fulfilled',
  };
}

type Poll = Awaited<
  ReturnType<typeof getHomeData>
>['polls'][number];

type PollOption = Poll['options'][number];

function getPollHref(poll: Poll) {
  const path = `/poll/${encodeURIComponent(String(poll.id))}`;

  return poll.slug
    ? `${path}/${encodeURIComponent(poll.slug)}`
    : path;
}

function getVoteCount(poll: Poll) {
  return poll.options.reduce(
    (total, option) =>
      total + Math.max(0, option.voteCount ?? 0),
    0,
  );
}

function getOptionLabel(
  option: PollOption,
  index: number,
) {
  const record = option as unknown as Record<
    string,
    unknown
  >;

  for (const field of [
    'text',
    'label',
    'name',
    'optionText',
    'title',
  ]) {
    const value = record[field];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return `विकल्प ${index + 1}`;
}

function PollCard({ poll }: { poll: Poll }) {
  const open = isPollOpen(poll);

  const region = REGIONS.find(
    (item) => item.code === poll.stateCode,
  );

  // केवल dedicated admin-controlled approval field से बैज दिखाएँ।
  const approved =
    (
      poll as unknown as {
        approvalStatus?: string;
      }
    ).approvalStatus === 'APPROVED';

  const national = poll.scope === 'NATIONAL' && !poll.stateCode && !poll.districtId && !poll.districtName;
  const location =
    poll.districtName ||
    region?.name ||
    (poll.scope === 'NATIONAL'
      ? 'अखिल भारतीय'
      : 'क्षेत्रीय पोल');

  return (
    <article className="jp-poll-card">
      <div className="jp-card-tags">
        <span className="jp-tag">
          {national
            ? 'राष्ट्रीय मुद्दे'
            : 'स्थानीय मुद्दे'}
        </span>

        <span className="jp-tag jp-tag-outline">
          {location}
        </span>

        <span className="jp-live">
          <i aria-hidden="true" />
          {open ? 'OPEN' : 'अवधि समाप्त'}
        </span>
      </div>

      {approved && (
        <span
          className="jp-approved"
          title="JanPoll टीम द्वारा समीक्षा की गई; परिणाम की गारंटी नहीं"
        >
          ✓ टीम द्वारा समीक्षित
        </span>
      )}

      <h3>
        <Link href={getPollHref(poll)}>
          {poll.question}
        </Link>
      </h3>

      <p className="mt-4 text-sm leading-8 text-slate-600">अपनी राय साझा करें। विकल्प और परिणाम देखने के लिए पोल खोलें।</p>

      <div className="jp-card-bottom">
        <span>{poll.options.length} विकल्प</span>

        <Link
          className="jp-card-action"
          href={getPollHref(poll)}
          aria-label={`पोल खोलें: ${poll.question}`}
        >
          {open ? 'राय दें' : 'परिणाम देखें'}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}

export default async function HomePage({ searchParams }: { searchParams?: Promise<{ category?: string }> }) {
  const requested = (await searchParams)?.category || 'all';
  const selectedCategory = CATEGORIES.some(item => item.slug === requested) ? requested : 'all';
  const [data, trendingStates] = await Promise.all([getHomeData(selectedCategory), getTrendingStates().catch(error => { console.error('Trending states unavailable', error); return []; })]);
  const stateActivity = new Map(trendingStates.map(state => [state.code, state]));

  const regions = REGIONS.map((region) => ({
    code: region.code,
    name: region.name,
    href: `/states?state=${encodeURIComponent(
      region.code,
    )}`,
    count: data.statesLoaded
      ? stateActivity.get(region.code)?.activePolls ?? data.stateCounts.get(region.code) ?? 0
      : null,
  }));

  const stats = [
    {
      value: data.voteCount,
      label: 'अब तक दर्ज वोट',
    },
    {
      value: data.pollCount,
      label: 'सक्रिय पोल',
    },
    {
      value: data.statesLoaded
        ? regions.filter(region => (region.count ?? 0) > 0).length
        : null,
      label: 'राज्य / UT में सक्रिय पोल',
    },
    {
      value: data.userCount,
      label: 'पंजीकृत उपयोगकर्ता',
    },
  ];

  return (
    <main className="jp-home" lang="hi">
      {/* BLOCK 1 — HERO */}
      <section
        className="jp-hero"
        aria-labelledby="home-title"
      >
        <div className="jp-wrap jp-hero-grid">
          <div>
            <p className="jp-eyebrow">
              <span
                className="jp-dot"
                aria-hidden="true"
              />
              INDIA’S INDEPENDENT OPINION PLATFORM
            </p>

            <h1 id="home-title">
              <span className="jp-headline-line">
                गाँव की चौपाल से
              </span>

              <span className="jp-headline-line jp-headline-green">
                देश की राजधानी तक।
              </span>
            </h1>

            <p className="jp-hero-copy">
              स्थानीय और राष्ट्रीय मुद्दों पर अपनी राय
              साझा करें। अपना सवाल उठाएँ, लोगों को
              जोड़ें और जानें कि भाग लेने वाले लोग
              क्या सोचते हैं।
            </p>

            <p lang="en" className="mt-3 text-sm leading-7 text-slate-600">Create a poll, share your question and explore public opinion across India. <Link href="/en" className="text-emerald-800 underline">English</Link></p>
            <div className="jp-actions">
              <Link
                className="jp-btn jp-btn-primary"
                href="/create"
              >
                पोल बनाएँ
                <span aria-hidden="true">↗</span>
              </Link>

              <a
                className="jp-btn jp-btn-light"
                href="#live-polls"
              >
                पोल देखें
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <aside className="jp-voice">
            <div className="jp-voice-top">
              <span>PEOPLE. OPINIONS. CHANGE.</span>
              <span aria-hidden="true">↗</span>
            </div>

            <span
              className="jp-quote"
              aria-hidden="true"
            >
              “
            </span>

            <h2>
              मुद्दा आपका है।
              <br />
              आवाज़ भी आपकी हो।
            </h2>

            <p>
              पानी, सड़क, शिक्षा या रोज़गार—आपके
              आसपास क्या बदलना चाहिए? सवाल उठाइए,
              जनमत जुटाइए।
            </p>

            <div className="jp-voice-bottom">
              <span
                className="jp-dot"
                aria-hidden="true"
              />
              आपकी बात, एक साझा मंच पर
            </div>
          </aside>
        </div>

        {/* REAL DATABASE STATISTICS */}
        <dl className="jp-wrap jp-stats">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>

              <dd>
                <CountUp value={stat.value} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <HomeContent kind="updates" />
      {/* BLOCK 2 — ABOUT + HOW IT WORKS */}
      <section
        className="jp-section jp-wrap jp-about"
        aria-labelledby="about-title"
      >
        <div>
          <p className="jp-eyebrow">
            JANPOLL क्या है?
          </p>

          <h2 id="about-title">
            एक सवाल से शुरू हो
            <br />
            <span>बदलाव की बातचीत।</span>
          </h2>

          <p>
            JanPoll एक स्वतंत्र सार्वजनिक राय मंच
            है। यहाँ आप अपने गाँव, वार्ड, शहर,
            राज्य और देश से जुड़े विषयों पर पोल
            बना सकते हैं और भाग लेने वाले लोगों
            की राय जान सकते हैं।
          </p>

          <p>
            क्या आपकी बात अनसुनी रह जाती है?
            पोल बनाकर उसे सामने लाइए। हमारी टीम
            महत्वपूर्ण जनहित के मुद्दों की समीक्षा
            कर उन्हें मंच पर फ़ीचर करने और व्यापक
            चर्चा तक पहुँचाने का प्रयास करेगी।
          </p>

          <Link
            href="/create"
            className="jp-text-link"
          >
            पोल बनाएँ, बदलाव की मुहिम से जुड़ें
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div
          className="jp-steps"
          aria-label="JanPoll कैसे काम करता है"
        >
          {STEPS.map((step) => (
            <div
              className="jp-step"
              key={step.number}
            >
              <span>{step.number}</span>

              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BLOCK 3 — CATEGORIES + FOUR REAL POLLS */}
      <section
        className="jp-feed-section"
        id="live-polls"
        aria-labelledby="polls-title"
      >
        <div className="jp-wrap">
          <div className="jp-section-heading">
            <div>
              <p className="jp-eyebrow">
                EXPLORE PUBLIC OPINION
              </p>

              <h2 id="polls-title">
                आज के लोकप्रिय जनमत
              </h2>
            </div>

            <Link
              href="/#live-polls"
              className="jp-text-link"
            >
              सभी पोल देखें
              <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <nav
            className="jp-categories"
            aria-label="पोल श्रेणियाँ"
          >
            <Link
              className="jp-chip jp-chip-dark"
              href="/#live-polls"
            >
              <span aria-hidden="true">◉</span>
              लाइव पोल
            </Link>

            <Link
              className="jp-chip"
              href="/closed-polls"
            >
              <span aria-hidden="true">▤</span>
              पुराने परिणाम
            </Link>

            <span
              className="jp-category-divider"
              aria-hidden="true"
            />

            {CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                className={`jp-chip ${
                  category.slug === selectedCategory
                    ? 'jp-chip-selected'
                    : ''
                }`}
                href={
                  category.slug === 'all'
                    ? '/#live-polls'
                    : `/?category=${category.slug}#live-polls`
                }
              >
                <span aria-hidden="true">
                  {category.icon}
                </span>
                {category.label}
              </Link>
            ))}
          </nav>

          {data.polls.length > 0 ? (
            <div className="jp-poll-grid">
              {data.polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                />
              ))}
            </div>
          ) : (
            <div className="jp-empty">
              <h3>
                {data.pollsFailed
                  ? 'पोल लोड नहीं हो सके'
                  : 'आज इस श्रेणी में अभी कोई वोट नहीं आया'}
              </h3>

              <p>
                {data.pollsFailed
                  ? 'कुछ देर बाद दोबारा कोशिश करें।'
                  : 'आज मिले मतों के आधार पर लोकप्रिय जनमत यहाँ दिखाई देंगे।'}
              </p>

              <Link
                className="jp-btn jp-btn-primary"
                href="/create"
              >
                ＋ पोल बनाएँ
              </Link>
            </div>
          )}

          {/* MODERATION INFORMATION */}
          <div className="jp-review-note">
            <span
              className="jp-review-icon"
              aria-hidden="true"
            >
              ✓
            </span>

            <div>
              <h3>
                समीक्षा, स्पष्ट पहचान और
                ज़िम्मेदार चर्चा
              </h3>

              <p>
                राष्ट्रीय स्तर के पोल की हमारी
                टीम समीक्षा करेगी। स्वीकृत पोल
                पर समीक्षा का बैज दिखाई देगा।
                समीक्षा लंबित होने पर भी पोल का
                लिंक साझा किया जा सकता है।
                बैज विषय की समीक्षा बताता है,
                परिणामों की सत्यता की गारंटी नहीं।
                हिंसक, आपत्तिजनक या नियम-विरुद्ध
                पोल हटाने का अधिकार प्रशासन के
                पास सुरक्षित है।
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="jp-wrap jp-regions" aria-labelledby="trending-states-title">
        <div className="jp-section-heading"><div><p className="jp-eyebrow">TRENDING STATES</p><h2 id="trending-states-title">जनमत में आगे रहने वाले राज्य</h2></div><Link href="/states" className="jp-text-link">सभी राज्य →</Link></div>
        <p className="jp-section-copy">राज्यों के सभी polls में अब तक दर्ज कुल votes के आधार पर। केवल वोट वाले राज्य दिखाए जाते हैं।</p>
        {trendingStates.length ? <div className="jp-featured-regions">{trendingStates.slice(0,4).map((region,index) => <Link className="jp-region" key={region.code} href={region.href}><span className="jp-region-code">#{index+1} · {region.code}</span><strong>{region.name}</strong><span>{numbers.format(region.votes)} दर्ज वोट</span><span className="jp-region-arrow" aria-hidden="true">↗</span></Link>)}</div> : <p className="mt-5 text-sm leading-7 text-slate-500">राज्यवार भागीदारी के आँकड़े उपलब्ध होने पर यहाँ दिखाई देंगे।</p>}
      </section>

      {/* BLOCK 4 — STATE / UT SELECTION */}
      <section
        className="jp-section jp-wrap"
        id="regions"
        aria-labelledby="regions-title"
      >
        <div className="jp-section-heading">
          <div>
            <p className="jp-eyebrow">
              STATES &amp; UNION TERRITORIES
            </p>

            <h2 id="regions-title">
              अपने आसपास का जनमत जानें
            </h2>
          </div>

          <span className="jp-region-total">
            {REGIONS.length} राज्य व केंद्र
            शासित प्रदेश
          </span>
        </div>

        <p className="jp-section-copy">
          राज्य चुनें और उससे जुड़े स्थानीय व
          क्षेत्रीय पोल देखें।
        </p>

        <RegionPicker regions={regions} />
      </section>

      <section className="jp-wrap py-10" aria-labelledby="create-guide-title"><h2 id="create-guide-title" className="text-2xl font-semibold text-emerald-950">नया पोल कैसे बनाएँ? / Create a poll</h2><p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600">अपने राज्य और स्थानीय मुद्दों पर जनता की राय जानने के लिए JanPoll पर सवाल और विकल्प जोड़ें। Creator Google से sign-in करता है; voting बिना login या login के बाद रख सकता है। राजस्थान में सरपंच, पंचायत समिति और जिला परिषद से जुड़े जनमत उसी स्थानीय interface से बनाए जा सकते हैं।</p><div className="mt-5 flex flex-wrap gap-4"><Link href="/poll-banaye" className="text-emerald-800 underline">पोल बनाने की जानकारी →</Link><Link href="/create/rajasthan?state=rajasthan" className="text-emerald-800 underline">राजस्थान में पोल बनाएँ →</Link><Link href="/en" lang="en" className="text-emerald-800 underline">Create a poll in India — English →</Link></div></section>

      {/* BLOCK 5 — FINAL CALL TO ACTION */}
      <section className="jp-cta">
        <div className="jp-wrap">
          <div>
            <p className="jp-eyebrow">
              बात उठेगी, तभी आगे बढ़ेगी।
            </p>

            <h2>
              आपकी आवाज़ को मिले एक मंच।
            </h2>

            <p>
              सवाल आपका। राय जनता की।
              शुरुआत आज से।
            </p>
          </div>

          <Link
            href="/create"
            className="jp-btn jp-btn-primary"
          >
            अपना पोल बनाएँ
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <HomeContent kind="articles" />
    </main>
  );
}