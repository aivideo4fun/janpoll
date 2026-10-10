'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ClosedPoll = {
  id: string;
  slug: string | null;
  question: string;
  createdAt: string;
  deadlineDays: number | null;
  options: { id: string; text: string; voteCount: number }[];
};

export default function ClosedPollsPage() {
  const [closedPolls, setClosedPolls] = useState<ClosedPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter polls based on search query
  const filteredPolls = closedPolls.filter((poll) =>
    poll.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate and Share/Download Result Image Canvas
  const handleShareCard = async (poll: ClosedPoll, totalVotes: number) => {
    setSharingId(poll.id);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Gradient
      const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
      gradient.addColorStop(0, '#064e3b'); // Emerald 900
      gradient.addColorStop(1, '#022c22'); // Dark Emerald
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 630);

      // Card Header Box
      ctx.fillStyle = '#ffffff';
      ctx.roundRect(60, 60, 1080, 510, 24);
      ctx.fill();

      // Brand Logo / Title
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('JanPoll.in — जनता का मत', 100, 125);

      // Total Votes Badge
      ctx.fillStyle = '#f1f5f9';
      ctx.roundRect(850, 90, 240, 50, 12);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`कुल वोट: ${totalVotes.toLocaleString('en-IN')}`, 885, 123);

      // Poll Question
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      let questionText = poll.question;
      if (questionText.length > 60) questionText = questionText.substring(0, 57) + '...';
      ctx.fillText(questionText, 100, 195);

      // Options & Percentages
      let startY = 270;
      poll.options.slice(0, 4).forEach((opt, idx) => {
        const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
        
        // Option Bar Bg
        ctx.fillStyle = '#f8fafc';
        ctx.roundRect(100, startY, 980, 65, 12);
        ctx.fill();

        // Progress Fill
        ctx.fillStyle = '#a7f3d0';
        const fillWidth = Math.max((980 * percentage) / 100, 20);
        ctx.roundRect(100, startY, fillWidth, 65, 12);
        ctx.fill();

        // Option Text
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 22px sans-serif';
        let optText = opt.text;
        if (optText.length > 45) optText = optText.substring(0, 42) + '...';
        ctx.fillText(optText, 130, startY + 40);

        // Percentage Text
        ctx.fillStyle = '#047857';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`${percentage}% (${opt.voteCount})`, 910, startY + 40);

        startY += 80;
      });

      // Footer branding
      ctx.fillStyle = '#64748b';
      ctx.font = '18px sans-serif';
      ctx.fillText('WhatsApp, Facebook और सोशल मीडिया पर शेयर करें | JanPoll से जुड़ें', 100, 545);

      // Convert to image and trigger download or share
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `janpoll-result-${poll.id}.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: poll.question,
              text: 'JanPoll समाप्त पोल परिणाम देखें:',
              files: [file],
            });
          } catch (err) {
            console.log(err);
          }
        } else {
          // Fallback download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `JanPoll-Result-${poll.id}.png`;
          a.click();
        }
        setSharingId(null);
      }, 'image/png');
    } catch (e) {
      console.error(e);
      setSharingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-800">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold transition"
        >
          ← होमपेज पर वापस जाएं
        </Link>
      </div>

      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-3xl p-6 md:p-8 mb-6 text-center shadow-md">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          📁 समाप्त हो चुके पोल्स (Closed Polls History)
        </h1>
        <p className="text-slate-200 text-xs md:text-sm">
          यहाँ पुराने पोल्स खोजें, परिणाम देखें और खूबसूरत रिजल्ट कार्ड सोशल मीडिया पर शेयर करें।
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 समाप्त हो चुका पोल या सवाल यहाँ खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3.5 pl-12 rounded-2xl border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800 font-medium placeholder-slate-400"
          />
          <span className="absolute left-4 top-4 text-lg">🔍</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">पोल्स लोड हो रहे हैं...</div>
      ) : filteredPolls.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-gray-500 shadow-sm">
          <span className="text-4xl mb-3 block">📭</span>
          कोई भी समाप्त पोल नहीं मिला।
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPolls.map((poll) => {
            const pollTotalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
            const pollUrl = poll.slug ? `/poll/${poll.id}/${poll.slug}` : `/poll/${poll.id}`;

            return (
              <div
                key={poll.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm opacity-95 hover:opacity-100 transition"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-500 mb-3">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold border border-slate-200">
                    🔒 पोल समाप्त (कुल वोट: {pollTotalVotes.toLocaleString('en-IN')})
                  </span>
                  <span>बनाए जाने की तिथि: {new Date(poll.createdAt).toLocaleDateString('hi-IN')}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-4">{poll.question}</h3>

                <div className="space-y-2 mb-5">
                  {poll.options.map((opt) => {
                    const percentage = pollTotalVotes > 0 ? Math.round((opt.voteCount / pollTotalVotes) * 100) : 0;
                    return (
                      <div
                        key={opt.id}
                        className="text-sm font-medium text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-200 relative overflow-hidden"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-slate-200/60 -z-0 transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                        <div className="relative z-10 flex justify-between items-center">
                          <span>{opt.text}</span>
                          <span className="font-bold text-xs text-slate-600">
                            {opt.voteCount} वोट ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap justify-between items-center pt-3 border-t border-slate-100 gap-3">
                  <button
                    onClick={() => handleShareCard(poll, pollTotalVotes)}
                    disabled={sharingId === poll.id}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                  >
                    {sharingId === poll.id ? 'कार्ड बन रहा है...' : '📤 रिजल्ट कार्ड शेयर करें'}
                  </button>

                  <Link
                    href={pollUrl}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow"
                  >
                    अतिम परिणाम देखें →
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