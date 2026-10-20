import 'server-only';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
export function validateCoverUrl(value:string){
 if(!value)return;
 if(value.length>1000)throw new Error('Image URL is too long.');
 if(/^\/uploads\/articles\/[a-f0-9-]+\.(jpg|png|webp)$/.test(value))return;
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use an HTTPS image URL.');
}
export async function articleImage(form:FormData){
 const url=String(form.get('coverImage')||'').trim();validateCoverUrl(url);
 const file=form.get('coverFile');
 if(!file||typeof file==='string'||file.size===0)return url||null;
 if(file.size>750*1024)throw new Error('Image exceeds 750 KB.');
 const bytes=Buffer.from(await file.arrayBuffer());
 let extension='';
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))extension='png';
 else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)extension='jpg';
 else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')extension='webp';
 else throw new Error('Use PNG, JPEG or WebP.');
 const filename=`${randomUUID()}.${extension}`;
 const directory=path.join(process.cwd(),'public','uploads','articles');
 await mkdir(directory,{recursive:true});await writeFile(path.join(directory,filename),bytes,{flag:'wx'});
 return `/uploads/articles/${filename}`;
}
