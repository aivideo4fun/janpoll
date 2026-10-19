const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');const ts=require('typescript');const crypto=require('node:crypto');
function load(file,mocks){const exports={};const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText;vm.runInNewContext(js,{exports,require:name=>name in mocks?mocks[name]:require(name),process,URL,URLSearchParams,Request,Response,console});return exports;}
let session=null;let token;let cookieOptions;
const owner=load('src/lib/polls/owner.ts',{'server-only':{},'next/headers':{cookies:()=>({get:()=>token?{value:token}:undefined,set:(name,value,options)=>{token=value;cookieOptions=options;}})},'next-auth':{getServerSession:async()=>session},'@/lib/google-auth':{googleAuthOptions:{}}});
const regions=load('src/lib/regions.ts',{});
const saved=new Map();
const db={poll:{findUnique:async({where})=>saved.get(where.id)||null,create:async({data})=>{const poll={...data,options:data.options.create};saved.set(poll.id,poll);return poll;}}};
process.env.NEXTAUTH_URL='http://127.0.0.1:3000';
const api=load('src/app/api/polls/public/route.ts',{'@/lib/db':{db},'@/lib/polls/owner':owner,'@/lib/google-auth':{googleAuthOptions:{}},'@/lib/regions':regions,'@/lib/slugify':{generateSlug:()=> 'test-poll'}});
const payload={stateCode:'RJ',question:'A valid question?',options:['Yes','No'],deadlineDays:3,requiresLogin:false,termsAgreed:true,requestId:crypto.randomUUID()};
const request=(body,origin='http://127.0.0.1:3000')=>new Request('http://127.0.0.1:3000/api/polls/public',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
(async()=>{
 assert.equal((await api.POST(request(payload))).status,201);
 const guestToken=token;const first=saved.get(payload.requestId);
 assert.equal(first.creatorEmail,null);assert.match(first.creatorGuestHash,/^[a-f0-9]{64}$/);assert.notEqual(first.creatorGuestHash,token);
 assert.equal(cookieOptions.httpOnly,true);assert.equal(cookieOptions.sameSite,'lax');
 assert.equal((await api.POST(request(payload))).status,200);
 token=undefined;assert.equal((await api.POST(request(payload))).status,409);
 session={user:{email:'owner@example.test',name:'Owner'}};
 const logged={...payload,requestId:crypto.randomUUID()};assert.equal((await api.POST(request(logged))).status,201);
 assert.equal(saved.get(logged.requestId).creatorEmail,'owner@example.test');assert.equal(saved.get(logged.requestId).creatorGuestHash,null);
 assert.equal((await api.POST(request({...payload,requestId:crypto.randomUUID(),termsAgreed:false}))).status,400);
 assert.equal((await api.POST(request({...payload,requestId:crypto.randomUUID()},'https://other.example'))).status,403);
 session=null;token=undefined;assert.equal(await owner.ownerWhere(),null);
 token=guestToken;const where=await owner.ownerWhere();assert.equal(where.creatorGuestHash,first.creatorGuestHash);assert.equal(where.creatorEmail,null);
 session={user:{email:'owner@example.test'}};const combined=await owner.ownerWhere();assert.equal(combined.OR.length,2);
 console.log('Guest creation, account creation, consent, origin, retry ownership and owner access checks passed (mock database).');
})().catch(error=>{console.error(error);process.exitCode=1;});
