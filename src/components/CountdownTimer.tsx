'use client';

import { useEffect, useState } from 'react';
import { getDeadline } from '@/lib/poll-utils';

export default function CountdownTimer({ createdAt, deadlineDays }: { createdAt: string | Date; deadlineDays: number | null }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const deadlineDate = getDeadline(new Date(createdAt), deadlineDays).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = deadlineDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt, deadlineDays]);

  if (!timeLeft) return <span className="text-gray-400">लोड हो रहा है...</span>;

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return <span className="text-red-600 font-bold">पोल समाप्त हो गया है</span>;
  }

  return (
    <span className="font-mono font-bold text-emerald-900">
      {timeLeft.days} दिन {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
}