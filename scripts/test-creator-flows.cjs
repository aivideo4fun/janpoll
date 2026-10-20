const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript'),crypto=require('node:crypto');
function load(file,mocks){const exports={};const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText;vm.runInNewContext(js,{exports,require:n=>n in mocks?mocks[n]:require(n),process,URL,URLSearchParams,Request,Response,console});return exports;}
let session=null,token,cookieOptions;
const owner=load('src/lib/polls/owner.ts',{'server-only':{},'next/headers':{cookies:()=>({get:()=>token?{value:token}:undefined,set:(n,v,o)=>{token=v;cookieOptions=o;}})},'next-auth':{getServerSession:async()=>session},'@/lib/google-auth':{googleAuthOptions:{}}});
const regions=load('src/lib/regions.ts',{}),saved=new Map();
const db={poll:{findUnique:async({where})=>saved.get(where.id)||null,create:async({data})=>{const p={...data,id:data.id||crypto.randomUUID(),options:data.options.create};saved.set(p.id,p);return p;}}};
db.district={findFirst:async({where})=>where.id==='district-rj'?{id:'district-rj',nameHi:'District'}:null};
db.panchayatSamiti={findFirst:async({where})=>where.id==='samiti-rj'&&where.districtId==='district-rj'?{id:'samiti-rj',nameHi:'Samiti'}:null};
db.gramPanchayat={findFirst:async({where})=>where.id==='gp-rj'&&where.samitiId==='samiti-rj'?{id:'gp-rj',nameHi:'GP'}:null};
db.samitiWard={findFirst:async({where})=>where.id==='ward-rj'&&where.samitiId==='samiti-rj'?{id:'ward-rj'}:null};
db.zilaParishadWard={findFirst:async({where})=>where.id==='zila-rj'&&where.districtId==='district-rj'?{id:'zila-rj'}:null};
const mocks={'@/lib/db':{db},'@/lib/creation-guard':{creationGuard:async()=>null},'@/lib/polls/owner':owner,'@/lib/regions':regions,'@/lib/slugify':{generateSlug:()=> 'test-poll'}};
const api=load('src/app/api/polls/public/route.ts',mocks),rajasthan=load('src/app/api/polls/rajasthan/route.ts',mocks);
process.env.NEXTAUTH_URL='http://127.0.0.1:3000';
const payload={stateCode:'RJ',question:'A valid question?',options:['Yes','No'],deadlineDays:3,requiresLogin:false,termsAgreed:true,requestId:crypto.randomUUID()};
const request=(body,origin='http://127.0.0.1:3000')=>new Request('http://127.0.0.1:3000/api/polls/public',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
(async()=>{
 assert.equal((await api.POST(request(payload))).status,401);assert.equal((await rajasthan.POST(request(payload))).status,401);assert.equal(saved.size,0);assert.equal(token,undefined);
 session={user:{email:'owner@example.test',name:'Google Owner'}};
 for(const requiresLogin of [false,true]){const input={...payload,requiresLogin,requestId:crypto.randomUUID()};assert.equal((await api.POST(request(input))).status,201);const poll=saved.get(input.requestId);assert.equal(poll.creatorEmail,'owner@example.test');assert.equal(poll.creatorName,'Google Owner');assert.equal(poll.creatorGuestHash,null);assert.equal(poll.requiresLogin,requiresLogin);assert.equal((await api.POST(request(input))).status,200);session={user:{email:'other@example.test',name:'Other'}};assert.equal((await api.POST(request(input))).status,409);session={user:{email:'owner@example.test',name:'Google Owner'}};}
 for(const electionType of ['sarpanch','samiti','zila'])for(const requiresLogin of [false,true]){
  const data={question:'Valid Rajasthan question',options:['Yes','No'],deadlineDays:3,termsAgreed:true,requiresLogin,electionType,districtId:'district-rj',...(electionType==='zila'?{zilaWardId:'zila-rj'}:{samitiId:'samiti-rj',...(electionType==='sarpanch'?{gramPanchayatId:'gp-rj'}:{samitiWardId:'ward-rj'})})};
  const response=await rajasthan.POST(request(data));assert.equal(response.status,201);const body=await response.json();const poll=saved.get(body.pollId);assert.equal(poll.creatorName,'Google Owner');assert.equal(poll.creatorEmail,'owner@example.test');assert.equal(poll.requiresLogin,requiresLogin);assert.equal(poll.stateCode,'RJ');
 }
 assert.equal((await api.POST(request({...payload,termsAgreed:false}))).status,400);assert.equal((await api.POST(request({...payload,creatorEmail:'forged@example.test'}))).status,400);assert.equal((await api.POST(request(payload,'https://other.example'))).status,403);
 session={user:{email:'owner@example.test',name:null}};assert.equal((await api.POST(request(payload))).status,422);
 // Legacy guest receipt/management access remains available; new guest creation is blocked.
 session=null;token=undefined;assert.equal(await owner.ownerWhere(),null);const legacy=await owner.creatorIdentity(true);assert.match(legacy.guestHash,/^[a-f0-9]{64}$/);assert.equal(cookieOptions.httpOnly,true);assert.equal((await owner.ownerWhere()).creatorGuestHash,legacy.guestHash);session={user:{email:'owner@example.test'}};assert.equal((await owner.ownerWhere()).OR.length,2);
 console.log('Creator checks passed: authenticated creator identity saved in both voting modes, guest creation blocked in both APIs, retries, forged identity rejection, terms/origin and legacy owner access (mock database).');
})().catch(e=>{console.error(e);process.exitCode=1;});
