import { redirect } from 'next/navigation';

import {
  getRegionByCode,
  getRegionBySlug,
} from '@/lib/regions';

export default function CreatePage({
  searchParams,
}: {
  searchParams?: {
    state?: string | string[];
  };
}) {
  const value = searchParams?.state;

  const state = (
    typeof value === 'string'
      ? value
      : Array.isArray(value)
        ? value[0] ?? ''
        : ''
  ).trim();

  const region =
    getRegionBySlug(state.toLowerCase()) ??
    getRegionByCode(state.toUpperCase());

  redirect(
    region
      ? `/create/public?state=${encodeURIComponent(region.slug)}`
      : '/create/public',
  );
}