'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ClosedPoll = {
  id: string;
  slug: string | null;
  question: string;
  createdAt: string;
  options: { id: string; text: string; voteCount: number }[];
};

export default function ClosedPollsPage() {
  const [closedPolls, setClosedPolls] = useState<ClosedPoll[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);

  // Closed polls fetch karna
  useEffect(() => {
    fetch('/api/closed-polls')
      .then((res) => res.json())
      .then((data) => {
        if (data.polls) setClosedPolls(data.polls);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchTerm.trim().toLowerCase());
  };

  const filteredPolls = closedPolls.filter((p) =>
    p.question.toLowerCase().includes(searchQuery)
  );

  // HTML5 Canvas Share Card Generator
  const handleShareCard = async (poll: ClosedPoll) => {
    setSharingId(poll.id);
    const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 1200, 630);

    // Card Box
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(50, 50, 1100, 530, 24);
    ctx.fill();

    // Header Branding
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('JanPoll.in — राजस्थान की जनता की आवाज़', 90, 110);

    // Total Votes Badge
    ctx.fillStyle = '#f1f5f9';
    ctx.roundRect(830, 80, 280, 45, 12);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`कुल वोट: ${totalVotes.toLocaleString('en-IN')}`, 865, 110);

    // Question
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 34px sans-serif';
    let qText = poll.question;
    if (qText.length > 55) qText = qText.substring(0, 52) + '...';
    ctx.fillText(qText, 90, 180);

    // Options Bars
    let startY = 240;
    poll.options.slice(0, 4).forEach((opt) => {
      const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;

      ctx.fillStyle = '#f8fafc';
      ctx.roundRect(90, startY, 1020, 60, 12);
      ctx.fill();

      ctx.fillStyle = '#a7f3d0';
      const fillW = Math.max((1020 * percentage) / 100, 20);
      ctx.roundRect(90, startY, fillW, 60, 12);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 20px sans-serif';
      let optText = opt.text;
      if (optText.length > 40) optText = optText.substring(0, 37) + '...';
      ctx.fillText(optText, 120, startY + 38);

      ctx.fillStyle = '#047857';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`${percentage}% (${opt.voteCount})`, 940, startY + 38);

      startY += 75;
    });

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText('WhatsApp और सोशल मीडिया पर परिणाम देखें | JanPoll.in', 90, 545);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `janpoll-result-${poll.id}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: poll.question,
            text: 'JanPoll समाप्त पोल का अंतिम परिणाम देखें:',
            files: [file],
          });
        } catch (err) {}
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `JanPoll-Result-${poll.id}.png`;
        a.click();
      }
      setSharingId(null);
    }, 'image/png');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/" className="text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition">
          ← होमपेज पर वापस जाएं
        </Link>
      </div>

      <div className="bg-slate-800 text-white rounded-3xl p-6 md:p-8 mb-6 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-black mb-2">📁 समाप्त हो चुके पोल्स (Closed Polls History)</h1>
        <p className="text-slate-300 text-xs md:text-sm">यहाँ पुराने पोल्स खोजें, परिणाम देखें और खूबसूरत रिजल्ट कार्ड इमेज शेयर करें।</p>
      </div>

      {/* Search Bar with Button */}
      <div className="mb-8 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="🔍 समाप्त हो चुका पोल या सवाल यहाँ खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm bg-slate-50/50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow"
            >
              खोजें 🔍
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSearchQuery(''); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-3 rounded-xl text-sm transition"
              >
                रीसेट
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">पोल्स लोड हो रहे हैं...</div>
      ) : filteredPolls.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-gray-500 shadow-sm">
          <span className="text-4xl mb-3 block">📭</span>
          {searchQuery ? 'आपके खोज शब्द से मिलता-जुलता कोई समाप्त पोल नहीं मिला।' : 'फिलहाल कोई भी समाप्त पोल उपलब्ध नहीं है।'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPolls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);
            return (
              <div key={poll.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                    🔒 पोल समाप्त (कुल वोट: {totalVotes.toLocaleString('en-IN')})
                  </span>
                  <span>दिनांक: {new Date(poll.createdAt).toLocaleDateString('hi-IN')}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-4">{poll.question}</h3>

                <div className="space-y-2 mb-5">
                  {poll.options.map((opt) => {
                    const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id} className="text-sm font-medium text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-200 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 bg-slate-200/60 -z-0" style={{ width: `${percentage}%` }}></div>
                        <div className="relative z-10 flex justify-between items-center">
                          <span>{opt.text}</span>
                          <span className="font-bold text-xs text-slate-600">{opt.voteCount} वोट ({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap justify-between items-center pt-3 border-t border-slate-100 gap-3">
                  <button
                    onClick={() => handleShareCard(poll)}
                    disabled={sharingId === poll.id}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm"
                  >
                    {sharingId === poll.id ? 'इमेज बन रही है...' : '📤 रिजल्ट कार्ड इमेज शेयर करें'}
                  </button>
                  <Link
                    href={`/poll/${poll.id}`}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow ml-auto"
                  >
                    अंतिम परिणाम देखें →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}