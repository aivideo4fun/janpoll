'use client';

import Link from 'next/link';
import { Suspense, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

import {
  REGIONS,
  getRegionByCode,
  getRegionBySlug,
} from '@/lib/regions';

const field =
  'min-h-12 w-full min-w-0 rounded-xl border border-slate-200 ' +
  'bg-white px-4 py-3 text-sm leading-7 text-slate-800 ' +
  'outline-none focus:border-emerald-600 focus:ring-4 ' +
  'focus:ring-emerald-50 disabled:bg-slate-50';

const button =
  'inline-flex min-h-12 items-center justify-center rounded-xl ' +
  'bg-emerald-800 px-5 py-3 text-sm font-semibold leading-7 ' +
  'text-white transition hover:bg-emerald-900 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

function CreateForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useSession();

  const rawState = (params.get('state') ?? '').trim();

  const initialRegion =
    getRegionBySlug(rawState.toLowerCase()) ??
    getRegionByCode(rawState.toUpperCase());

  const [stateCode, setStateCode] = useState(
    initialRegion?.code ?? '',
  );

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [deadlineDays, setDeadlineDays] = useState(3);
  const [requiresLogin, setRequiresLogin] = useState(true);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [busy, setBusy] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [error, setError] = useState('');

  const lock = useRef(false);

  const requestRef = useRef<{
    snapshot: string;
    id: string;
  } | null>(null);

  const region = getRegionByCode(stateCode);

  const login = async () => {
    setLoginBusy(true);
    setError('');

    try {
      const query = new URLSearchParams();

      if (region) {
        query.set('state', region.slug);
      }

      const callbackUrl =
        `${window.location.origin}/create/public` +
        (query.size ? `?${query.toString()}` : '');

      await signIn(undefined, { callbackUrl });
    } catch {
      setError('Login शुरू नहीं हो सका। दोबारा कोशिश करें।');
    } finally {
      setLoginBusy(false);
    }
  };

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (lock.current) return;

    setError('');

    if (status !== 'authenticated') {
      setError('पहले login करें।');
      return;
    }

    if (!region) {
      setError('अपना राज्य चुनें।');
      return;
    }

    const cleanQuestion = question.trim();
    const cleanOptions = options.map((option) => option.trim());

    if (cleanQuestion.length < 5 || cleanQuestion.length > 500) {
      setError('सवाल 5 से 500 अक्षरों में लिखें।');
      return;
    }

    if (
      cleanOptions.length < 2 ||
      cleanOptions.length > 15 ||
      cleanOptions.some((option) => !option || option.length > 255)
    ) {
      setError('दो से पंद्रह विकल्प भरें। प्रत्येक अधिकतम 255 अक्षर रखें।');
      return;
    }

    const normalized = cleanOptions.map((option) =>
      option.normalize('NFC').toLocaleLowerCase(),
    );

    if (new Set(normalized).size !== normalized.length) {
      setError('एक जैसे विकल्प दोबारा न लिखें।');
      return;
    }

    if (!termsAgreed) {
      setError('नियम और शर्तें स्वीकार करें।');
      return;
    }

    const payload = {
      stateCode: region.code,
      question: cleanQuestion,
      options: cleanOptions,
      deadlineDays,
      requiresLogin,
      termsAgreed: true,
    };

    const snapshot = JSON.stringify(payload);

    lock.current = true;
    setBusy(true);

    let completed = false;

    try {
      if (
        !requestRef.current ||
        requestRef.current.snapshot !== snapshot
      ) {
        requestRef.current = {
          snapshot,
          id: crypto.randomUUID(),
        };
      }

      const response = await fetch('/api/polls/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          requestId: requestRef.current.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'पोल प्रकाशित नहीं हो सका।');
      }

      if (
        typeof data.pollId !== 'string' ||
        data.scope !== 'STATE' ||
        data.stateCode !== region.code
      ) {
        throw new Error(
          'Confirmation अधूरी मिली। तुरंत दूसरा पोल न बनाएँ।',
        );
      }

      completed = true;
      router.push(`/poll/${encodeURIComponent(data.pollId)}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'पोल प्रकाशित नहीं हो सका।',
      );
    } finally {
      if (!completed) {
        lock.current = false;
        setBusy(false);
      }
    }
  };

  return (
    <main
      lang="hi"
      className="min-h-screen bg-[#F5F8F6] px-4 py-8 text-slate-800 sm:py-12"
    >
      <div className="mx-auto max-w-2xl">
        <Link
          href="/states"
          className="inline-flex min-h-11 items-center text-sm leading-7 text-emerald-800 hover:underline"
        >
          ← सभी राज्य
        </Link>

        <p className="mt-5 text-xs font-semibold tracking-widest text-emerald-700">
          JANPOLL / CREATE YOUR POLL
        </p>

        <h1 className="mt-3 text-3xl font-semibold leading-normal text-emerald-950 sm:text-4xl">
          अपना पोल बनाएँ
        </h1>

        <p className="mt-4 text-sm leading-8 text-slate-500">
          एक सवाल पूछें, विकल्प जोड़ें और लोगों की राय जानें।
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm leading-7 text-red-700"
          >
            {error}
          </p>
        )}

        <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5">
          <label
            htmlFor="poll-state"
            className="mb-2 block text-sm font-medium leading-7"
          >
            राज्य / केंद्र शासित प्रदेश
          </label>

          <select
            id="poll-state"
            className={field}
            value={stateCode}
            disabled={busy || loginBusy}
            onChange={(event) => {
              setStateCode(event.target.value);
              setError('');
            }}
          >
            <option value="">अपना राज्य चुनें</option>

            {REGIONS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>

          {region && (
            <p className="mt-2 text-xs leading-7 text-emerald-700">
              आपका पोल {region.name} के page पर दिखाई देगा।
            </p>
          )}
        </section>

        {status === 'loading' ? (
          <p role="status" className="mt-6 text-sm leading-7">
            Session जाँचा जा रहा है…
          </p>
        ) : status !== 'authenticated' ? (
          <section className="mt-5 rounded-3xl border border-emerald-100 bg-white p-5 sm:p-7">
            <h2 className="text-xl font-semibold leading-9 text-emerald-950">
              पोल बनाने के लिए login करें
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              Login के बाद सवाल और विकल्प भर सकते हैं।
            </p>

            <button
              type="button"
              onClick={login}
              disabled={loginBusy || !region}
              className={`${button} mt-5`}
            >
              {loginBusy ? 'खुल रहा है…' : 'Login / Continue →'}
            </button>
          </section>
        ) : (
          <form
            onSubmit={publish}
            className="mt-5 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7"
          >
            <fieldset disabled={busy} className="min-w-0 space-y-6">
              <div>
                <label
                  htmlFor="poll-question"
                  className="mb-2 block text-sm font-semibold leading-7"
                >
                  आपका सवाल
                </label>

                <textarea
                  id="poll-question"
                  className={field}
                  rows={3}
                  required
                  minLength={5}
                  maxLength={500}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="आप किस विषय पर लोगों की राय जानना चाहते हैं?"
                />

                <p className="mt-1 text-right text-xs leading-6 text-slate-400">
                  {question.length}/500
                </p>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold leading-7">
                  जवाब के विकल्प
                </legend>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <label className="min-w-0 flex-1">
                        <span className="sr-only">
                          विकल्प {index + 1}
                        </span>

                        <input
                          className={field}
                          required
                          maxLength={255}
                          value={option}
                          placeholder={`विकल्प ${index + 1}`}
                          onChange={(event) =>
                            setOptions((current) =>
                              current.map((text, position) =>
                                position === index
                                  ? event.target.value
                                  : text,
                              ),
                            )
                          }
                        />
                      </label>

                      {options.length > 2 && (
                        <button
                          type="button"
                          aria-label={`विकल्प ${index + 1} हटाएँ`}
                          className="min-h-12 rounded-xl px-3 text-xl text-slate-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() =>
                            setOptions((current) =>
                              current.filter(
                                (_, position) => position !== index,
                              ),
                            )
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 15 && (
                  <button
                    type="button"
                    onClick={() =>
                      setOptions((current) => [...current, ''])
                    }
                    className="mt-3 min-h-11 text-sm font-medium leading-7 text-emerald-800"
                  >
                    ＋ विकल्प जोड़ें
                  </button>
                )}
              </fieldset>

              <details className="rounded-2xl border border-slate-200 p-4">
                <summary className="cursor-pointer text-sm font-medium leading-7">
                  अवधि और voting settings
                </summary>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="poll-duration"
                      className="mb-2 block text-sm leading-7"
                    >
                      अवधि
                    </label>

                    <select
                      id="poll-duration"
                      className={field}
                      value={deadlineDays}
                      onChange={(event) =>
                        setDeadlineDays(Number(event.target.value))
                      }
                    >
                      {[1, 3, 7, 14, 30, 60].map((days) => (
                        <option key={days} value={days}>
                          {days} दिन
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="poll-voting"
                      className="mb-2 block text-sm leading-7"
                    >
                      वोट देने का तरीका
                    </label>

                    <select
                      id="poll-voting"
                      className={field}
                      value={requiresLogin ? 'login' : 'open'}
                      onChange={(event) =>
                        setRequiresLogin(event.target.value === 'login')
                      }
                    >
                      <option value="login">Login के बाद</option>
                      <option value="open">बिना login</option>
                    </select>
                  </div>
                </div>
              </details>

              <label className="flex items-start gap-3 text-sm leading-7 text-slate-600">
                <input
                  type="checkbox"
                  required
                  checked={termsAgreed}
                  onChange={(event) =>
                    setTermsAgreed(event.target.checked)
                  }
                  className="mt-1.5 h-4 w-4 shrink-0 accent-emerald-800"
                />

                <span>
                  मैं JanPoll की{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-800 underline"
                  >
                    नियम और शर्तों
                  </Link>{' '}
                  से सहमत हूँ।
                </span>
              </label>

              <button
                type="submit"
                disabled={busy || !region || !termsAgreed}
                className={`${button} w-full`}
              >
                {busy ? 'प्रकाशित हो रहा है…' : 'अपना पोल बनाएँ →'}
              </button>

              <p className="text-xs leading-7 text-slate-500">
                यह सार्वजनिक poll होगा। निजी जानकारी सवाल या विकल्पों
                में न लिखें।
              </p>
            </fieldset>
          </form>
        )}
      </div>
    </main>
  );
}

function CreateRoute() {
  const params = useSearchParams();

  return <CreateForm key={params.toString()} />;
}

export default function PublicCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-sm text-emerald-800">
          लोड हो रहा है…
        </div>
      }
    >
      <CreateRoute />
    </Suspense>
  );
}