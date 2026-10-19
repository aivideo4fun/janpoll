import { redirect } from 'next/navigation';
import { getRegionByCode, getRegionBySlug } from '@/lib/regions';
export default function CreatePage({ searchParams = {} }: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    const item = Array.isArray(value) ? value[0] : value;
    if (item) query.set(key, item);
  });
  const state = (query.get('state') || '').trim();
  const region = getRegionBySlug(state.toLowerCase()) || getRegionByCode(state.toUpperCase());
  const legacy = ['gpId', 'gramPanchayatId', 'districtId', 'district', 'samitiId', 'samiti', 'zilaWardId'].some(key => query.has(key));
  if (region?.code === 'RJ' || (!state && legacy)) {
    query.set('state', 'rajasthan');
    redirect(`/create/rajasthan?${query.toString()}`);
  }
  redirect(region ? `/create/public?state=${encodeURIComponent(region.slug)}` : '/create/public');
}
