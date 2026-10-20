'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';

import { updateProfileName } from './actions';

const button =
  'inline-flex min-h-12 items-center justify-center rounded-xl ' +
  'bg-emerald-800 px-5 py-3 text-sm font-semibold leading-7 ' +
  'text-white transition hover:bg-emerald-900 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export function ProfileLogin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function login() {
    setBusy(true);
    setError('');

    try {
      await signIn('google', {
        callbackUrl: `${window.location.origin}/profile`,
      });
    } catch {
      setError('Login शुरू नहीं हो सका। दोबारा कोशिश करें।');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={login}
        disabled={busy}
        className={`${button} w-full sm:w-auto`}
      >
        {busy ? 'खुल रहा है…' : 'Continue with Google →'}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm leading-7 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function logout() {
    setBusy(true);
    setError('');

    try {
      await signOut({ callbackUrl: '/' });
    } catch {
      setError('Logout नहीं हो सका। दोबारा कोशिश करें।');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="min-h-11 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm leading-7 text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? 'Logout हो रहा है…' : 'Logout'}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-xs leading-7 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProfileNameForm({
  initialName,
}: {
  initialName: string;
}) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    const formData = new FormData(event.currentTarget);

    setBusy(true);
    setMessage('');

    try {
      const result = await updateProfileName(formData);

      setSuccess(result.success);
      setMessage(result.message);

      if (result.success) {
        setName(result.name);
        router.refresh();
      }
    } catch {
      setSuccess(false);
      setMessage('नाम अपडेट नहीं हो सका। दोबारा कोशिश करें।');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label
          htmlFor="profile-name"
          className="mb-2 block text-sm font-medium leading-7 text-slate-700"
        >
          आपका नाम
        </label>

        <input
          id="profile-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          value={name}
          disabled={busy}
          onChange={(event) => {
            setName(event.target.value);
            setMessage('');
          }}
          className="min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 disabled:bg-slate-50"
          placeholder="अपना नाम लिखें"
        />
      </div>

      {message && (
        <p
          role={success ? 'status' : 'alert'}
          className={`rounded-xl p-3 text-sm leading-7 ${
            success
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message}
        </p>
      )}

      <button type="submit" disabled={busy} className={button}>
        {busy ? 'Save हो रहा है…' : 'बदलाव Save करें'}
      </button>
    </form>
  );
}