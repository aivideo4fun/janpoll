const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
function load(file,mocks){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports,require:n=>n in mocks?mocks[n]:require(n),process,console:{...console,error:()=>{}}});return exports;}
let session=null,device='browser-a',records=[],count=0,throwCreate=false,cacheFailure=false,denied=false,queue=Promise.resolve();
const poll={id:'poll-a',active:true,createdAt:new Date(),deadlineDays:60,requiresLogin:false};
const tx={
 $queryRaw:async()=>[],
 poll:{findUnique:async({where,select})=>where.id===poll.id?{...poll,options:select.options.where.id==='option-a'?[{id:'option-a'}]:[]}:null},
 vote:{count:async()=>0,findFirst:async({where})=>records.find(v=>v.pollId===where.pollId&&(where.OR?where.OR.some(rule=>Object.entries(rule).every(([k,val])=>v[k]===val)):v.ipAddress===where.ipAddress&&v.deviceSig===where.deviceSig))||null,create:async({data})=>{if(throwCreate)throw new Error('DB write failed');records.push({...data,createdAt:new Date()});}},
 pollOption:{update:async()=>{count++;}},
};
const db={user:{findUnique:async()=>session?{id:'account-a'}:null},voteAttempt:{create:async()=>{}},$transaction:async callback=>{const previous=queue;let unlock;queue=new Promise(resolve=>unlock=resolve);await previous;const before=[...records],beforeCount=count;try{return await callback(tx);}catch(error){records=before;count=beforeCount;throw error;}finally{unlock();}}};
const policy=load('src/lib/voting-policy.ts',{});
const {castVote}=load('src/lib/actions.ts',{'@/lib/db':{db},'next-auth':{getServerSession:async()=>session},'@/lib/google-auth':{googleAuthOptions:{}},'next/cache':{revalidatePath:()=>{if(cacheFailure)throw new Error('cache failed');}},'next/headers':{cookies:async()=>({set:(key,value)=>device=value})},'@/lib/poll-utils':{isPollOpen:p=>p.active&&p.createdAt.getTime()+p.deadlineDays*86400000>Date.now()},'@/lib/voter':{DEVICE_COOKIE:'jp_device',getVoterIdentity:async()=>({ipHash:'network-a',deviceId:device})},'@/lib/voting-policy':policy,'@/lib/rate-limit':{takeRateLimit:async()=>({allowed:!denied,count:121})}});
const sig='a'.repeat(32);
function reset(){records=[];count=0;device='browser-a';session=null;poll.active=true;poll.requiresLogin=false;throwCreate=false;cacheFailure=false;denied=false;process.env.REQUIRE_LOGIN_FOR_ALL_VOTES='false';}
(async()=>{
 reset();poll.requiresLogin=true;assert.equal((await castVote('poll-a','option-a',sig)).code,'AUTH_REQUIRED');assert.equal(count,0);
 session={user:{id:'account-a',email:'owner@example.test'}};assert.equal((await castVote('poll-a','option-a',sig)).success,true);device='incognito-b';assert.equal((await castVote('poll-a','option-a',sig)).code,'ALREADY_VOTED');assert.equal(count,1);
 reset();assert.equal((await castVote('poll-a','other-option',sig)).code,'INVALID');assert.equal(count,0);
 reset();poll.active=false;assert.equal((await castVote('poll-a','option-a',sig)).code,'CLOSED');
 reset();assert.equal((await castVote('poll-a','option-a',sig)).success,true);records[0].createdAt=new Date(Date.now()-86400000);device='incognito-b';assert.equal((await castVote('poll-a','option-a',sig)).code,'ALREADY_VOTED');assert.equal(count,1);
 reset();const concurrent=await Promise.all(Array.from({length:8},()=>castVote('poll-a','option-a',sig)));assert.equal(concurrent.filter(r=>r.success).length,1);assert.equal(count,1);
 reset();throwCreate=true;assert.equal((await castVote('poll-a','option-a',sig)).code,'ERROR');assert.equal(count,0);
 reset();cacheFailure=true;assert.equal((await castVote('poll-a','option-a',sig)).success,true);assert.equal(count,1);
 reset();process.env.REQUIRE_LOGIN_FOR_ALL_VOTES='true';assert.equal((await castVote('poll-a','option-a',sig)).code,'AUTH_REQUIRED');assert.equal(count,0);
 reset();denied=true;assert.equal((await castVote('poll-a','option-a',sig)).code,'ERROR');assert.equal(count,0);
 console.log('Voting guards passed: auth, account/incognito repeat, full-lifetime guest repeat, invalid option, closed poll, concurrent requests, rollback, cache failure, strict mode, rate limit (mock transactions).');
})().catch(error=>{console.error(error);process.exitCode=1;});
