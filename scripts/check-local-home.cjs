// Read-only diagnostic. Refuses remote databases. Executes the actual ranking helper without Next's request cache.
process.env.NODE_ENV='development';
require('@next/env').loadEnvConfig(process.cwd(),true,{info(){},error(){}});
const url=new URL(process.env.DATABASE_URL||'http://invalid');
if(!['postgresql:','postgres:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)){
 console.error('Stopped: use the local PostgreSQL database for this diagnostic. No data changed.');process.exit(1);
}
const fs=require('fs'),vm=require('vm'),ts=require('typescript'),{PrismaClient}=require('@prisma/client');
const db=new PrismaClient(),exportsObject={};
const code=ts.transpileModule(fs.readFileSync('src/lib/home-ranking.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInNewContext(code,{exports:exportsObject,Date,Map,process,require:n=>n==='server-only'?{}:n==='next/cache'?{unstable_cache:fn=>fn}:n==='@/lib/db'?{db}:require(n)});
(async()=>{const {start,end}=exportsObject.indiaDayBounds();console.log('India-day UTC window:',start.toISOString(),end.toISOString());console.log('Local votes today:',await db.vote.count({where:{createdAt:{gte:start,lt:end}}}));const polls=await exportsObject.getTodayTopPolls();console.log('Homepage ranking (actual local DB):',polls.map(p=>({id:p.id,question:p.question})));if(!polls.length)console.log('No eligible active polls received votes today. Empty trending is expected; no fallback/fake votes are added.');})().catch(error=>{console.error('Local ranking check failed:',error.code||error.name);process.exitCode=1;}).finally(()=>db.$disconnect());
