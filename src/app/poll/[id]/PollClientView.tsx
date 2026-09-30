'use client';

import { useState, useEffect } from 'react';
import { castVote } from '@/lib/actions';
import { getOrCreateAnonymousUserId } from '@/lib/anonymous-user';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#047857', '#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#065F46', '#022C22'];

export default function PollClientView({ poll }: { poll: any }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const id = getOrCreateAnonymousUserId();
    setUserId(id);

    // Local storage check karein ki user ne pehle vote kiya hai kya
    const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
    if (votedPolls[poll.id]) {
      setHasVoted(true);
    }
  }, [poll.id]);

  const totalVotes = poll.options.reduce((acc: number, opt: any) => acc + opt.voteCount, 0);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) {
      alert('कृपया कोई एक विकल्प चुनें!');
      return;
    }

    setLoading(true);
    const res = await castVote(poll.id, selectedOption, userId);
    setLoading(false);

    if (res.success) {
      setHasVoted(true);
      const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
      votedPolls[poll.id] = true;
      localStorage.setItem('voted_polls', JSON.stringify(votedPolls));
      setMessage('आपका वोट सफलतापूर्वक दर्ज हो गया!');
    } else {
      setMessage(res.message);
      setHasVoted(true); // Agar pehle vote de chuka hai toh result dikhao
    }
  };

  const chartData = poll.options.map((opt: any) => ({
    name: opt.text,
    votes: opt.voteCount,
  }));

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: poll.question,
        text: `🗳️ इस JanPoll पर अपनी राय दें:\n"${poll.question}"\n\n👉`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('पोल लिंक क्लिपबोर्ड पर कॉपी हो गया है!');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 text-gray-800">
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 md:p-8">
        
        {/* Header Badge */}
        <div className="flex justify-between items-center text-xs text-emerald-800 font-semibold mb-4">
          <span className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            📍 राजस्थान पब्लिक पोल
          </span>
          <span className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ⏳ समय सीमा: {poll.deadlineDays || 3} दिन
          </span>
        </div>

        <h1 className="text-xl md:text-2xl font-black text-emerald-900 mb-6 leading-snug">
          {poll.question}
        </h1>

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl text-center font-medium">
            {message}
          </div>
        )}

        {!hasVoted ? (
          <form onSubmit={handleVoteSubmit} className="space-y-3">
            {poll.options.map((option: any) => (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                  selectedOption === option.id
                    ? 'border-emerald-600 bg-emerald-50/60 font-semibold shadow-xs'
                    : 'border-emerald-100 hover:bg-emerald-50/20'
                }`}
              >
                <input
                  type="radio"
                  name="voteOption"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => setSelectedOption(option.id)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-gray-800 text-base">{option.text}</span>
              </label>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl transition shadow text-base disabled:opacity-50"
            >
              {loading ? 'वोट सबमिट हो रहा है...' : 'Submit Vote (वोट दें)'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-center font-bold">
              ✅ परिणाम और आंकड़े (कुल वोट: {totalVotes})
            </div>

            {/* Pie Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="votes"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Options Percentage Breakdown */}
            <div className="space-y-3">
              {poll.options.map((option: any, index: number) => {
                const percentage = totalVotes > 0 ? ((option.voteCount / totalVotes) * 100).toFixed(1) : 0;
                return (
                  <div key={option.id} className="bg-emerald-50/20 p-3 rounded-xl border border-emerald-100">
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span className="text-gray-800">{option.text}</span>
                      <span className="font-bold text-emerald-800">{option.voteCount} votes ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-emerald-100/60 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleShare}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl transition shadow flex items-center justify-center gap-2 text-base"
            >
              📲 Share this Poll (पोल शेयर करें)
            </button>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-white rounded-xl text-xs text-gray-500 text-center border border-emerald-100 shadow-sm">
        JanPoll के सभी पोल्स केवल जनता की राय जानने के लिए हैं। यह किसी सरकारी संस्था या आधिकारिक चुनावी मतदान प्रणाली का हिस्सा नहीं है।
      </div>
    </div>
  );
}