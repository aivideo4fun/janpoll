import { redirect } from 'next/navigation';
import { getRegionByCode, getRegionBySlug } from '@/lib/regions';
import PublicCreateForm from './PublicCreateForm';
export default async function PublicCreatePage({searchParams=Promise.resolve({})}:{searchParams?:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;const query=new URLSearchParams();
 Object.entries(params).forEach(([key,value])=>{const item=Array.isArray(value)?value[0]:value;if(item)query.set(key,item);});
 const state=(query.get('state')||query.get('stateCode')||'').trim();
 const region=getRegionBySlug(state.toLowerCase())||getRegionByCode(state.toUpperCase());
 if(region?.code==='RJ'){query.set('state','rajasthan');redirect(`/create/rajasthan?${query.toString()}`);}
 return <PublicCreateForm/>;
}
