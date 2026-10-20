import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-auth';
export const dynamic='force-dynamic';
const item=z.object({nameEn:z.string().trim().min(1).max(150).optional(),nameHi:z.string().trim().min(1).max(150).optional(),wardNo:z.coerce.number().int().min(1).max(500).optional()}).strict();
export async function POST(request:Request){
  if(!(await isAdmin()))return NextResponse.json({message:'Unauthorized'},{status:401});
  if(request.headers.get('origin')!==new URL(process.env.NEXTAUTH_URL||request.url).origin)return NextResponse.json({message:'Invalid origin'},{status:403});
  try {
    const form=await request.formData();const type=z.enum(['gramPanchayat','zilaWard','panchayatSamiti']).parse(form.get('type'));
    const districtId=z.string().min(1).max(100).parse(form.get('districtId'));const samitiId=String(form.get('samitiId')||'');
    const raw=String(form.get('dataList')||'[]');if(raw.length>500000)throw new Error('Upload too large');
    const items=z.array(item).min(1).max(2000).parse(JSON.parse(raw));
    if(!(await db.district.findUnique({where:{id:districtId},select:{id:true}})))throw new Error('Invalid district');
    if(type==='gramPanchayat'&&!(await db.panchayatSamiti.findFirst({where:{id:samitiId,districtId},select:{id:true}})))throw new Error('Samiti mismatch');
    if(items.some(row=>type==='zilaWard'?!row.wardNo:!row.nameEn))throw new Error('Required names/ward missing');
    await db.$transaction(async tx=>{
      for(const row of items){
        if(type==='gramPanchayat')await tx.gramPanchayat.upsert({where:{samitiId_nameEn:{samitiId,nameEn:row.nameEn!}},update:{nameHi:row.nameHi||row.nameEn!},create:{samitiId,districtId,nameEn:row.nameEn!,nameHi:row.nameHi||row.nameEn!}});
        else if(type==='zilaWard')await tx.zilaParishadWard.upsert({where:{districtId_wardNo:{districtId,wardNo:row.wardNo!}},update:{nameHi:row.nameHi||`वार्ड ${row.wardNo}`},create:{districtId,wardNo:row.wardNo!,nameHi:row.nameHi||`वार्ड ${row.wardNo}`}});
        else await tx.panchayatSamiti.upsert({where:{districtId_nameEn:{districtId,nameEn:row.nameEn!}},update:{nameHi:row.nameHi||row.nameEn!},create:{districtId,nameEn:row.nameEn!,nameHi:row.nameHi||row.nameEn!}});
      }
    },{timeout:30000});
    return NextResponse.json({success:true,message:`${items.length} records processed.`});
  } catch(error){console.error('Location upload rejected',error);return NextResponse.json({success:false,message:'मान्य district, parent और upload rows जाँचें।'},{status:400});}
}
