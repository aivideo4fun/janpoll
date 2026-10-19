'use server';

import { redirect } from 'next/navigation';

import {
  getRegionByCode,
  getRegionBySlug,
} from '@/lib/regions';

export async function createPollAction(formData: FormData) {
  const raw = formData.get('state') ?? formData.get('stateCode');
  const state = typeof raw === 'string' ? raw.trim() : '';

  const region =
    getRegionBySlug(state.toLowerCase()) ??
    getRegionByCode(state.toUpperCase());

  redirect(
    region
      ? `/create/public?state=${encodeURIComponent(region.slug)}`
      : '/create/public',
  );
}