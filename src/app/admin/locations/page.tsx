import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
import LocationManager from '../components/LocationManager';
import {addSamitis,addGramPanchayats,addSamitiWards,addZilaWards,updateLocationName,deleteLocationItem} from '../actions/locationActions';
export const dynamic='force-dynamic';
export const metadata={title:'Location Manager | JanPoll Admin',robots:{index:false,follow:false}};
export default async function Page(){if(!(await isAdmin()))redirect('/admin');const districts=await db.district.findMany({select:{id:true,nameHi:true,nameEn:true,stateCode:true},orderBy:{nameHi:'asc'}});return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-7xl"><Link href="/admin" className="text-emerald-800">← Dashboard</Link><h1 className="my-6 text-3xl font-semibold text-emerald-950">स्थान और पंचायत प्रबंधन</h1><LocationManager districts={districts} addSamitis={addSamitis} addGramPanchayats={addGramPanchayats} addSamitiWards={addSamitiWards} addZilaWards={addZilaWards} updateLocationName={updateLocationName} deleteLocationItem={deleteLocationItem}/></div></main>;}
