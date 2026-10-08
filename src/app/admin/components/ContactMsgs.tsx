type MessageData = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  message: string;
  createdAt: Date;
};

type ContactMsgsProps = {
  messages: MessageData[];
  deleteMessage: (formData: FormData) => Promise<void>;
  formatIndiaDateTime: (value: Date | string) => string;
  whatsappDigits: (value: string) => string;
};

export default function ContactMsgs({
  messages,
  deleteMessage,
  formatIndiaDateTime,
  whatsappDigits,
}: ContactMsgsProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
        <div>
          <h2 className="text-sm font-black text-emerald-900 sm:text-base">
            ✉️ उपयोगकर्ता संपर्क संदेश (इनबॉक्स)
          </h2>
          <p className="mt-1 text-[11px] text-emerald-700">संपर्क करें फॉर्म से प्राप्त सभी संदेश यहाँ सुरक्षित हैं</p>
        </div>

        <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
          कुल: {messages.length}
        </span>
      </div>

      <div className="divide-y divide-emerald-100">
        {messages.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-4xl">📭</div>
            <p className="mt-3 text-sm font-semibold text-gray-500">
              अभी तक कोई संपर्क संदेश प्राप्त नहीं हुआ है।
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const whatsappNumber = msg.whatsapp ? whatsappDigits(msg.whatsapp) : '';

            return (
              <article key={msg.id} className="p-5 transition hover:bg-emerald-50/30 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-gray-900">{msg.name}</h3>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                        नया संदेश
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 text-xs sm:flex-row sm:flex-wrap sm:gap-4">
                      <a href={`mailto:${msg.email}`} className="font-semibold text-emerald-700 hover:underline">
                        📧 {msg.email}
                      </a>

                      {msg.whatsapp ? (
                        <a
                          href={whatsappNumber ? `https://wa.me/${whatsappNumber}` : '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-green-700 hover:underline"
                        >
                          📱 व्हाट्सएप: {msg.whatsapp}
                        </a>
                      ) : (
                        <span className="text-gray-400">📱 व्हाट्सएप नंबर उपलब्ध नहीं</span>
                      )}
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{msg.message}</p>
                    </div>

                    <p className="text-[11px] text-gray-400">
                      प्राप्त हुआ: {formatIndiaDateTime(msg.createdAt)}
                    </p>
                  </div>

                  <form action={deleteMessage} className="lg:pt-1">
                    <input type="hidden" name="msgId" value={msg.id} />
                    <button
                      type="submit"
                      className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 lg:w-auto"
                    >
                      संदेश डिलीट करें
                    </button>
                  </form>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}