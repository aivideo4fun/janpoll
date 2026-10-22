import { getTrendingStates } from '@/lib/state-trending';
import { getRecentSessions, getIssuePoll } from '@/lib/home-community';
import HomeGuides from '@/components/home/HomeGuides';
import { getTodayTopPolls } from '@/lib/home-ranking';
import HomeNews from '@/components/home/HomeNews';
import HomeMotion from '@/components/home/HomeMotion';
import HomeAnnouncements from '@/components/home/HomeAnnouncements';
import VideoSection from '@/components/home/VideoSection';
import StateArt from '@/components/home/StateArt';
import StateDirectory from '@/components/home/StateDirectory';
import Adsterra728 from '@/components/home/Adsterra728';
import { ArrowRight, Plus, SquarePen, ListChecks, Share2 } from 'lucide-react';
import Link from 'next/link';
import { isPollOpen } from '@/lib/poll-utils';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { REGIONS } from '@/lib/regions';
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

const numbers = new Intl.NumberFormat('en-IN');

async function getHomeData(category: string, query = '') {
  const filters: Record<string, Prisma.PollWhereInput> = {
    politics: { OR: [{ topic: 'political' }, { categoryType: 'political' }] },
    elections: { electionType: { in: ['sarpanch', 'samiti', 'zila', 'assembly'] } },
    national: { scope: 'NATIONAL', stateCode: null, districtId: null, districtName: null },
    local: { OR: [{ scope: 'STATE' }, { districtId: { not: null } }, { districtName: { not: null } }] },
    sports: { topic: 'sports' },
    entertainment: { topic: 'entertainment' },
  };

  const results = await Promise.allSettled([
    db.poll.count(),

    db.pollOption.aggregate({
      _sum: { voteCount: true },
    }),

    getRecentSessions(),

    query ? db.poll.findMany({
      where: { AND: [{ active: true }, filters[category] || {}, { OR: [
        { question: { contains: query, mode: 'insensitive' } },
        { districtName: { contains: query, mode: 'insensitive' } },
        { stateCode: { in: REGIONS.filter(r => `${r.name} ${r.en} ${r.code}`.toLowerCase().includes(query.toLowerCase())).map(r => r.code) } },
      ] }] }, orderBy: { createdAt: 'desc' }, take: 8, include: { options: true },
    }) : getTodayTopPolls(filters[category] || {}),

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
        <span>{poll.options.length} विकल्प{'todayVoteCount' in poll && typeof poll.todayVoteCount==='number' ? ` · आज ${numbers.format(poll.todayVoteCount)} वोट` : ''}</span>

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

export default async function HomePage({ searchParams }: { searchParams?: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const requested = params?.category || 'all';
  const selectedCategory = CATEGORIES.some(item => item.slug === requested) ? requested : 'all';
  const query = (params?.q || '').trim().slice(0, 100);
  const [data, trending, issue] = await Promise.all([getHomeData(selectedCategory, query), getTrendingStates().catch(()=>null), getIssuePoll()]);
  const stateVotes = trending===null?null:Object.fromEntries((trending || []).map(state=>[state.code,state.votes]));
  const metric = (value:number|null)=>value===null?'—':numbers.format(value);
  return <main className="jh-home" lang="hi"><div className="jh-shell"><HomeMotion />
    <section className="jh-panel jh-rajasthan" aria-labelledby="jh-rajasthan-title">
      <h1 id="jh-rajasthan-title">राजस्थान की जनता की आवाज़</h1>
      <div className="jh-rajasthan-content"><StateArt code="RJ" variant="featured" /><div><p className="jh-featured-name">राजस्थान</p><p className="jh-featured-copy">अपने गांव, पंचायत और जिले की राय जानें।</p><div className="jh-actions"><Link href="/rajasthan" className="jh-button jh-primary">राजस्थान के पोल देखें <ArrowRight aria-hidden="true" /></Link><Link href="/create/rajasthan?state=rajasthan" className="jh-button jh-secondary">पोल बनाएं</Link></div></div></div>
    </section>
    <section className="jh-panel jh-create" aria-labelledby="jh-create-title"><div><span className="jh-kicker">आसान • ऑनलाइन • स्थानीय</span><h2 id="jh-create-title">आपकी राय मायने रखती है</h2><p className="jh-section-copy">अपने गांव, शहर और राज्य के मुद्दों पर सवाल पूछें।</p><div className="jh-actions"><Link href="/create" className="jh-button jh-primary"><Plus aria-hidden="true" /> अपना पोल बनाएं</Link><a href="#live-polls" className="jh-button jh-secondary">पोल देखें</a></div></div><ol className="jh-steps" aria-label="पोल बनाने के तीन कदम">{[{title:'सवाल लिखें',Icon:SquarePen},{title:'विकल्प जोड़ें',Icon:ListChecks},{title:'पोल शेयर करें',Icon:Share2}].map(({title,Icon},i)=><li key={title}><span className="jh-step-number">{i+1}</span><span className="jh-step-icon"><Icon aria-hidden="true" /></span><span>{title}</span></li>)}</ol><p className="jh-create-note">शुरू करने के लिए “अपना पोल बनाएं” दबाएं और Google से लॉगिन करें।</p></section>
    <HomeAnnouncements />
    <section className="jh-panel" aria-labelledby="community-stats"><h2 id="community-stats">JanPoll पर जनता की भागीदारी</h2><dl className="jh-community-stats">
      {[["कुल पोल",data.pollCount],["कुल दर्ज वोट",data.voteCount],["वोट वाले राज्य / UT",trending===null?null:trending.length],["सक्रिय सत्र · 5 मिनट*",data.userCount]].map(([label,value])=><div key={String(label)}><dt>{label}</dt><dd>{metric(value as number|null)}</dd></div>)}
    </dl><p className="jh-metric-note">*पिछले 5 मिनट में गतिविधि वाली, analytics की सहमति देने वाली sessions का अनुमान; यह अलग-अलग लोगों की सटीक संख्या नहीं है। आँकड़े सरकारी चुनाव परिणाम नहीं हैं।</p></section>
    <StateDirectory query={query} votes={stateVotes} />
    {trending===null && <p role="status" className="jh-metric-note">राज्यों के vote totals अभी उपलब्ध नहीं हैं; नाम के अनुसार दिखाए गए हैं।</p>}
    <Adsterra728 placement="home" />
    <section className="jh-panel" id="live-polls" aria-labelledby="polls-title"><div className="jh-section-head"><h2 id="polls-title">{query ? 'आपकी खोज के पोल' : 'आज के सबसे ज़्यादा वोट वाले 4 पोल'}</h2><Link href="/rajasthan" className="jh-text-link">और पोल देखें →</Link></div>
      {!query && <p className="jh-metric-note">आज 00:00 से अभी तक मिले votes के आधार पर · भारतीय समय (IST) · लगभग हर 30 सेकंड में अपडेट।</p>}
      {query && <p className="jh-search-status" role="status">खोज: “{query}” <Link href="/#live-polls">खोज हटाएं ×</Link></p>}
      <nav className="jh-categories" aria-label="पोल श्रेणियां">{CATEGORIES.map(item => <Link key={item.slug} href={`/?category=${item.slug}${query ? `&q=${encodeURIComponent(query)}` : ''}#live-polls`} className={selectedCategory === item.slug ? 'jh-category jh-selected' : 'jh-category'} aria-current={selectedCategory === item.slug ? 'page' : undefined}>{item.label}</Link>)}</nav>
      {data.pollsFailed ? <p className="jh-empty">पोल अभी लोड नहीं हो पाए। कुछ देर बाद फिर कोशिश करें।</p> : data.polls.length ? <div className="jh-poll-grid">{data.polls.map(poll => <PollCard key={poll.id} poll={poll} />)}</div> : <div className="jh-empty"><p>{query ? 'इस खोज का कोई पोल नहीं मिला। दूसरा शब्द खोजें।' : 'आज इस सूची के लिए कोई vote दर्ज नहीं हुआ। आज vote पाने वाले अधिकतम 4 पोल यहाँ दिखेंगे।'}</p><Link className="jh-text-link" href="/create">अपना सवाल जोड़ें →</Link></div>}
    </section>
    <section className="jh-panel jh-issue"><span className="jh-kicker">आपके क्षेत्र की प्राथमिकता</span><h2>सड़क, पानी, शिक्षा — सबसे पहले क्या बदले?</h2><p className="jh-section-copy">पेयजल, सड़कें, स्कूल, स्वास्थ्य, रोज़गार, सफाई, बिजली और परिवहन: एक सवाल में अपने क्षेत्र की सबसे ज़रूरी समस्या चुनें। इसमें राय दें, फिर अपने क्षेत्र के लिए अलग पोल बनाकर चर्चा आगे बढ़ाएँ।</p><div className="jh-actions">{issue && <Link href={`/poll/${issue.id}`} className="jh-button jh-primary">{isPollOpen(issue)?'मुद्दों के पोल में अपनी राय दें':'मुद्दों के पोल के परिणाम देखें'} →</Link>}<Link href="/create" className="jh-button jh-secondary">अपने क्षेत्र का पोल बनाएँ</Link></div><p className="jh-metric-note">जनमत सेवा की मांग समझने में मदद कर सकता है। शिकायत के आधिकारिक निवारण के लिए संबंधित विभाग से भी संपर्क करें।</p></section>
    <HomeNews />
    <HomeGuides />
    <VideoSection />
    <section className="jh-panel jh-about"><div><h2>JanPoll क्या है?</h2><p>अपने क्षेत्र और देश के मुद्दों पर राय रखने और जनमत जानने का आसान मंच। सवाल बनाएं, लोगों की राय लें और चर्चा आगे बढ़ाएं।</p><Link href="/how-it-works" className="jh-text-link">पूरी गाइड पढ़ें →</Link></div><dl className="jh-stats"><div><dt>दर्ज वोट</dt><dd>{data.voteCount === null ? '—' : numbers.format(data.voteCount)}</dd></div><div><dt>कुल पोल</dt><dd>{data.pollCount === null ? '—' : numbers.format(data.pollCount)}</dd></div></dl></section>
    <p className="jh-disclaimer">JanPoll एक जनमत मंच है। यह सरकारी मतदान प्रणाली या आधिकारिक चुनाव परिणाम नहीं है।</p>
  </div></main>;
}
