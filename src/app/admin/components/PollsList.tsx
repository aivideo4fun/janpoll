import Link from 'next/link';
import { getDeadline } from '@/lib/poll-utils';
import { formatIndiaDateTime } from '@/lib/format-india';

type PollsListProps = {
  polls: any[];
  totalPolls: number;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  deletePoll: (formData: FormData) => Promise<void>;
  editPoll: (formData: FormData) => Promise<void>;
  addPollOption: (formData: FormData) => Promise<void>;
  formatIndiaDate: (value: Date | string) => string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const EXTEND_OPTIONS = [1, 2, 3, 5, 7, 10, 15, 30, 60, 90];

export default function PollsList({
  polls,
  totalPolls,
  searchQuery,
  currentPage,
  totalPages,
  deletePoll,
  editPoll,
  addPollOption,
  formatIndiaDate,
}: PollsListProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
        <div>
          <h2 className="text-sm font-black text-emerald-900 sm:text-base">📊 पंजीकृत पोल्स</h2>
          <p className="mt-1 text-[11px] text-emerald-700">सभी सार्वजनिक पोल्स और उनके विकल्प</p>
        </div>

        <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
          {totalPolls}
        </span>
      </div>

      <div className="divide-y divide-emerald-100">
        {polls.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-4xl">📊</div>
            <p className="mt-3 text-sm font-semibold text-gray-500">
              डेटाबेस में कोई पोल उपलब्ध नहीं है।
            </p>
          </div>
        ) : (
          polls.map((poll) => {
            const pollTotalVotes = poll.options.reduce(
              (sum: number, option: any) => sum + option.voteCount,
              0
            );

            const deadline = getDeadline(new Date(poll.createdAt), poll.deadlineDays);
            const msLeft = deadline.getTime() - Date.now();
            const isExpired = msLeft <= 0;
            const daysLeft = Math.ceil(msLeft / DAY_MS);

            return (
              <article key={poll.id} className="p-5 transition hover:bg-emerald-50/20 sm:p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            poll.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {poll.active ? '● सक्रिय' : '○ निष्क्रिय'}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            isExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isExpired ? '⏳ अवधि समाप्त' : `⏳ ${daysLeft} दिन शेष`}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {formatIndiaDate(poll.createdAt)}
                        </span>
                      </div>

                      <h3 className="text-lg font-black leading-7 text-gray-900">{poll.question}</h3>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                        <span>
                          👤 <strong className="text-gray-700">{poll.creatorName || 'गुमनाम'}</strong>
                        </span>
                        <span>
                          📧 <strong className="text-gray-700">{poll.creatorEmail || 'ईमेल उपलब्ध नहीं'}</strong>
                        </span>
                        <span>
                          👥 <strong className="text-gray-700">{pollTotalVotes} मत</strong>
                        </span>
                        {poll.districtName && (
                          <span>
                            📍 <strong className="text-gray-700">{poll.districtName}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/poll/${poll.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                      >
                        पोल देखें →
                      </Link>

                      <form action={deletePoll}>
                        <input type="hidden" name="pollId" value={poll.id} />
                        <button
                          type="submit"
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                        >
                          पोल डिलीट करें
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* एडिट फॉर्म */}
                  <details className="group rounded-2xl border border-blue-200 bg-blue-50/40">
                    <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-blue-900">
                      <span className="mr-2 inline-block transition group-open:rotate-90">▶</span>
                      इस पोल को एडिट करें
                    </summary>

                    <div className="border-t border-blue-200 p-4">
                      <form action={editPoll} className="space-y-4">
                        <input type="hidden" name="pollId" value={poll.id} />

                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-gray-700">
                            पोल प्रश्न (Heading / Question)
                          </label>
                          <textarea
                            name="question"
                            required
                            maxLength={500}
                            defaultValue={poll.question}
                            rows={3}
                            className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none"
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-gray-700">निर्माता का नाम</label>
                            <input
                              name="creatorName"
                              type="text"
                              defaultValue={poll.creatorName ?? ''}
                              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-gray-700">निर्माता का ईमेल</label>
                            <input
                              name="creatorEmail"
                              type="email"
                              defaultValue={poll.creatorEmail ?? ''}
                              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-gray-700">जिला</label>
                            <input
                              name="districtName"
                              type="text"
                              defaultValue={poll.districtName ?? ''}
                              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-gray-700">पंचायत समिति</label>
                            <input
                              name="samitiName"
                              type="text"
                              defaultValue={poll.samitiName ?? ''}
                              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-gray-700">ग्राम पंचायत</label>
                            <input
                              name="gramPanchayatName"
                              type="text"
                              defaultValue={poll.gramPanchayatName ?? ''}
                              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-gray-700">ग्राम पंचायत आईडी</label>
                            <input
                              name="gramPanchayatId"
                              type="text"
                              defaultValue={poll.gramPanchayatId ?? ''}
                              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-gray-700">पोल स्थिति (Status)</label>
                            <select
                              name="active"
                              defaultValue={poll.active ? 'true' : 'false'}
                              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm outline-none"
                            >
                              <option value="true">सक्रिय</option>
                              <option value="false">निष्क्रिय</option>
                            </select>
                          </div>
                        </div>

                        {/* ⏳ पोल की अवधि */}
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                          <p className="text-xs font-black text-amber-900">⏳ पोल की अवधि</p>
                          <p className="mt-1 text-xs text-gray-600">
                            अंतिम तिथि: <strong className="text-gray-800">{formatIndiaDateTime(deadline)}</strong>
                            {' · '}
                            {isExpired ? (
                              <span className="font-bold text-red-700">अवधि समाप्त हो चुकी है</span>
                            ) : (
                              <span className="font-bold text-emerald-700">{daysLeft} दिन शेष</span>
                            )}
                          </p>

                          <label className="mb-1.5 mt-3 block text-xs font-bold text-gray-700">
                            अवधि बढ़ाएँ
                          </label>
                          <select
                            name="extendDays"
                            defaultValue=""
                            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none"
                          >
                            <option value="">कोई बदलाव नहीं</option>
                            {EXTEND_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                +{d} दिन बढ़ाएँ
                              </option>
                            ))}
                          </select>
                          <p className="mt-1.5 text-[10px] leading-4 text-gray-500">
                            {isExpired
                              ? 'अवधि समाप्त है, इसलिए चुने हुए दिन आज से गिने जाएँगे। वोटिंग दोबारा खोलने के लिए ऊपर पोल स्थिति "सक्रिय" रखें।'
                              : 'चुने हुए दिन मौजूदा अंतिम तिथि में जुड़ जाएँगे।'}
                          </p>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-black text-gray-700">विकल्प संपादित करें</p>
                            <span className="text-[10px] text-gray-500">मत सुरक्षित रहेंगे</span>
                          </div>

                          <div className="space-y-2">
                            {poll.options.map((option: any) => (
                              <div key={option.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input type="hidden" name="optionId" value={option.id} />
                                <input
                                  type="text"
                                  name="optionText"
                                  required
                                  defaultValue={option.text}
                                  className="min-w-0 flex-1 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs outline-none"
                                />
                                <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-2 text-center text-[10px] font-black text-emerald-800">
                                  {option.voteCount} मत
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            className="rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow transition hover:bg-blue-800"
                          >
                            ✓ बदलाव सुरक्षित करें
                          </button>
                        </div>
                      </form>
                    </div>
                  </details>

                  {/* विकल्प जोड़ें */}
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black text-emerald-900">मौजूदा विकल्प</p>
                      <span className="text-[10px] font-semibold text-gray-500">{poll.options.length} विकल्प</span>
                    </div>

                    <form action={addPollOption} className="flex flex-col gap-2 sm:flex-row">
                      <input type="hidden" name="pollId" value={poll.id} />
                      <input
                        type="text"
                        name="optionText"
                        required
                        maxLength={255}
                        placeholder="नया विकल्प यहाँ जोड़ें..."
                        className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-xs outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
                      >
                        + विकल्प जोड़ें
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* पेजिनेशन नियंत्रण */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-2 p-6 bg-emerald-50/30 border-t border-emerald-100">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            return (
              <Link
                key={p}
                href={`/admin?page=${p}${queryParam}`}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  currentPage === p
                    ? 'bg-emerald-700 text-white shadow'
                    : 'bg-white text-gray-700 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                पृष्ठ {p}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}