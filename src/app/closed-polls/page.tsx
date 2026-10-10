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
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/closed-polls')
      .then((res) => res.json())
      .then((data) => {
        if (data.polls) setClosedPolls(data.polls);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredPolls = closedPolls.filter((p) =>
    p.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // HTML5 Canvas Image Generator for Beautiful Result Card
  const handleShareCard = async (poll: ClosedPoll) => {
    setSharingId(poll.id);
    const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 1200, 630);

    // Card White Box
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(50, 50, 1100, 530, 24);
    ctx.fill();

    // Header Branding
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('JanPoll.in — राजस्थान की जनता की आवाज़', 90, 110);

    // Total Votes Badge
    ctx.fillStyle = '#f1f5f9';
    ctx.roundRect(850, 80, 260, 45, 12);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`कुल वोट: ${totalVotes.toLocaleString('en-IN')}`, 885, 110);

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
            text: 'JanPoll समाप्त पोल का अंतिम परिणाम:',
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
        <Link href="/" className="text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl text-xs font-bold">
          ← होमपेज पर जाएं
        </Link>
      </div>

      <div className="bg-slate-800 text-white rounded-3xl p-6 md:p-8 mb-6 text-center">
        <h1 className="text-2xl font-black mb-2">📁 समाप्त हो चुके पोल्स (Closed Polls History)</h1>
        <p className="text-slate-300 text-xs">पुराने पोल्स खोजें और खूबसूरत इमेज कार्ड शेयर करें।</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 समाप्त हो चुका पोल या सवाल यहाँ खोजें..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-5 py-3 rounded-2xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-emerald-600 bg-white text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-10">लोड हो रहा है...</div>
      ) : filteredPolls.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border text-gray-500">कोई समाप्त पोल नहीं मिला।</div>
      ) : (
        <div className="space-y-4">
          {filteredPolls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);
            return (
              <div key={poll.id} className="bg-white rounded-2xl p-6 border shadow-sm">
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                  🔒 समाप्त पोल (कुल वोट: {totalVotes})
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 mb-4">{poll.question}</h3>
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <button
                    onClick={() => handleShareCard(poll)}
                    disabled={sharingId === poll.id}
                    className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    {sharingId === poll.id ? 'इमेज बन रही है...' : '📤 रिजल्ट कार्ड इमेज शेयर करें'}
                  </button>
                  <Link href={`/poll/${poll.id}`} className="bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs">
                    परिणाम देखें →
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