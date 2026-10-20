const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
let ranking=[{pollId:'today-high'},{pollId:'today-low'}],received,reads=0;
const db={vote:{groupBy:async input=>{received=input;return ranking;}},poll:{findMany:async()=>{reads++;return [{id:'today-low',options:[{voteCount:99999}]},{id:'today-high',options:[{voteCount:3}]}];}}};
const code=ts.transpileModule(fs.readFileSync('src/lib/home-ranking.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const context={exports:{},Date,Map,require:n=>n==='server-only'?{}:n==='next/cache'?{unstable_cache:fn=>fn}:n==='@/lib/db'?{db}:require(n)};
vm.runInNewContext(code,context);
(async()=>{
 const {indiaDayBounds,getTodayTopPolls}=context.exports;
 let day=indiaDayBounds(new Date('2026-10-19T18:29:59Z'));assert.equal(day.start.toISOString(),'2026-10-18T18:30:00.000Z');assert.equal(day.end.toISOString(),'2026-10-19T18:30:00.000Z');
 day=indiaDayBounds(new Date('2026-10-19T18:30:00Z'));assert.equal(day.start.toISOString(),'2026-10-19T18:30:00.000Z');assert.equal(day.end.toISOString(),'2026-10-20T18:30:00.000Z');
 day=indiaDayBounds(new Date('2027-01-01T00:00:00Z'));assert.equal(day.start.toISOString(),'2026-12-31T18:30:00.000Z');
 const result=await getTodayTopPolls({topic:'sports'});assert.equal(result[0].id,'today-high');assert.equal(result[1].id,'today-low');assert.equal(received.take,4);assert.equal(received.where.poll.AND[1].topic,'sports');assert.equal(received.orderBy[0]._count.pollId,'desc');assert.equal(received.where.createdAt.lt-received.where.createdAt.gte,86400000);
 ranking=[];reads=0;assert.equal((await getTodayTopPolls()).length,0);assert.equal(reads,0);
 console.log('Homepage ranking checks passed: IST midnight/year boundary, daily rather than lifetime order, category filter, top-four limit and no zero-vote fallback (mock database).');
})().catch(e=>{console.error(e);process.exitCode=1;});
