'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const numbers = new Intl.NumberFormat('en-IN');

export function CountUp({
  value,
}: {
  value: number | null;
}) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (value === null) {
      setDisplayValue(null);
      return;
    }

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    let startTime: number | null = null;

    setDisplayValue(0);

    function animate(timestamp: number) {
      if (startTime === null) {
        startTime = timestamp;
      }

      const progress = Math.min(
        (timestamp - startTime) / 2000,
        1,
      );

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        Math.round((value as number) * easedProgress),
      );

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span
      aria-label={
        value === null
          ? 'आंकड़े उपलब्ध नहीं'
          : numbers.format(value)
      }
    >
      <span aria-hidden="true">
        {displayValue === null
          ? '—'
          : numbers.format(displayValue)}
      </span>
    </span>
  );
}

export type RegionItem = {
  code: string;
  name: string;
  href: string;
  count: number | null;
};

export function RegionPicker({
  regions,
}: {
  regions: RegionItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const normalizedQuery = query
    .trim()
    .toLocaleLowerCase();

  const filteredRegions = regions.filter((region) =>
    `${region.name} ${region.code}`
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );

  return (
    <div className="jp-region-picker">
      <button
        type="button"
        className="jp-btn jp-btn-primary"
        aria-expanded={isOpen}
        aria-controls="janpoll-region-list"
        onClick={() => setIsOpen((previous) => !previous)}
      >
        {isOpen
          ? 'राज्यों की सूची बंद करें'
          : 'अपना राज्य / केंद्र शासित प्रदेश चुनें'}

        <span aria-hidden="true">
          {isOpen ? '−' : '＋'}
        </span>
      </button>

      {isOpen && (
        <div
          id="janpoll-region-list"
          className="jp-region-panel"
        >
          <label htmlFor="janpoll-region-search">
            राज्य या केंद्र शासित प्रदेश खोजें
          </label>

          <input
            id="janpoll-region-search"
            type="search"
            placeholder="नाम या कोड लिखें…"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />

          <p
            className="jp-search-status"
            role="status"
          >
            {filteredRegions.length} परिणाम
          </p>

          <div className="jp-region-grid">
            {filteredRegions.map((region) => (
              <Link
                key={region.code}
                className="jp-region"
                href={region.href}
              >
                <span className="jp-region-code">
                  {region.code}
                </span>

                <strong>{region.name}</strong>

                <span>
                  {region.count === null
                    ? 'आंकड़े उपलब्ध नहीं'
                    : `${numbers.format(
                        region.count,
                      )} सक्रिय पोल`}
                </span>

                <span
                  className="jp-region-arrow"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </Link>
            ))}
          </div>

          {filteredRegions.length === 0 && (
            <p className="jp-search-empty">
              इस नाम का राज्य नहीं मिला। दूसरा नाम
              या राज्य का कोड लिखें।
            </p>
          )}
        </div>
      )}
    </div>
  );
}