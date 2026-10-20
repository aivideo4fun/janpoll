const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript'),crypto=require('node:crypto');
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,{exports,require:name=>name in mocks?mocks[name]:require(name),process,Buffer,URL,Request,Response,console});return exports;}
let cookie;process.env.ADMIN_USER='guard-test';process.env.ADMIN_PASS='guard-test-password';process.env.ADMIN_SECRET=crypto.randomBytes(32).toString('hex');
const auth=load('src/lib/admin-auth.ts',{'server-only':{},'next/headers':{cookies:async()=>({get:()=>cookie?{value:cookie}:undefined})}});
const sign=payload=>crypto.createHmac('sha256',process.env.ADMIN_SECRET).update(payload).digest('hex');
(async()=>{
 assert.equal(await auth.isAdmin(),false);let expiry=String(Date.now()+60000);cookie=expiry+'.'+sign(expiry);assert.equal(await auth.isAdmin(),true);
 cookie=expiry+'.'+'😀'.repeat(32);assert.equal(await auth.isAdmin(),false);cookie=expiry+'.'+sign(expiry)+'.extra';assert.equal(await auth.isAdmin(),false);expiry=String(Date.now()-1000);cookie=expiry+'.'+sign(expiry);assert.equal(await auth.isAdmin(),false);
 const route=load('src/app/api/admin/upload-location/route.ts',{'@/lib/db':{db:{}},'@/lib/admin-auth':{isAdmin:async()=>false}});assert.equal((await route.POST(new Request('http://localhost/api/admin/upload-location',{method:'POST'}))).status,401);
 const disabled=load('src/app/api/admin/db-action/route.ts',{'@/lib/admin-auth':{isAdmin:async()=>true}});assert.equal((await disabled.POST()).status,410);
 const {NextRequest}=require('next/server');const mid=load('src/middleware.ts');assert.equal(mid.middleware(new NextRequest('http://localhost/admin',{headers:{'x-middleware-subrequest':'test'}})).status,400);const response=mid.middleware(new NextRequest('http://localhost/admin'));assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
 console.log('Admin signature, malformed cookie, unauthenticated upload, disabled web DB mutation and middleware privacy/header checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
