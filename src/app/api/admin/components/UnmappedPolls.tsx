import LocationPicker from './LocationPicker';

type District = { id: string; nameHi: string; nameEn: string };

type UnmappedPollsProps = {
  polls: {
    id: string;
    question: string;
    districtName: string | null;
    samitiName: string | null;
    gramPanchayatName: string | null;
    createdAt: Date;
    active: boolean;
    options: { voteCount: number }[];
  }[];
  total: number;
  districts: District[];
  assignPollLocation: (formData: FormData) => Promise<void>;
  formatIndiaDateTime: (value: Date | string) => string;
};

export default function UnmappedPolls({
  polls,
  total,
  districts,
  assignPollLocation,
  formatIndiaDateTime,
}: UnmappedPollsProps) {
  if (polls.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-10 text-center">
        <div className="text-4xl">✅</div>
        <p className="mt-3 text-sm font-bold text-emerald-900">
          सभी पोल किसी न किसी पंचायत से जुड़े हुए हैं।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        ये पोल सीधे जिले में बने हैं या इनका पंचायत डेटा से मेल नहीं खाता। जिला → पंचायत समिति → ग्राम पंचायत चुनकर
        "जोड़ें" दबाएँ, फिर यह पोल उसी पंचायत, समिति और जिले के पेज पर भी दिखेगा।
        {total > polls.length ? ` (कुल ${total} में से नवीनतम ${polls.length} दिखाए गए हैं)` : ''}
      </p>

      {polls.map((poll) => {
        const votes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);
        const current = [poll.gramPanchayatName, poll.samitiName, poll.districtName].filter(Boolean).join(' · ');

        return (
          <article key={poll.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span
                className={`rounded-full px-2.5 py-1 font-bold ${
                  poll.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {poll.active ? '● सक्रिय' : '○ निष्क्रिय'}
              </span>
              <span>🗳️ {votes.toLocaleString('en-IN')} मत</span>
              <span>{formatIndiaDateTime(poll.createdAt)}</span>
            </div>

            <h3 className="text-sm font-black leading-6 text-gray-900">{poll.question}</h3>
            <p className="mt-1 text-[11px] text-gray-500">
              वर्तमान स्थान: <strong className="text-gray-700">{current || 'कोई स्थान नहीं'}</strong>
            </p>

            <form action={assignPollLocation} className="mt-3 space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
              <input type="hidden" name="pollId" value={poll.id} />
              <LocationPicker districts={districts} depth="gp" partial />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-blue-800"
                >
                  ✓ पंचायत से जोड़ें
                </button>
              </div>
            </form>
          </article>
        );
      })}
    </div>
  );
}