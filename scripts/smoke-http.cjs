// Read-only HTTP checks plus an UNAUTHENTICATED empty admin POST (must be rejected).
const assert=require('node:assert/strict');
const base=process.env.JANPOLL_SMOKE_BASE||'http://127.0.0.1:3100';
(async()=>{
 for(const path of ['/','/advertise','/editorial-policy','/privacy-policy','/robots.txt']){
  const response=await fetch(base+path);assert.equal(response.status,200,path);const body=await response.text();
  if(path==='/'){assert(!body.includes('class="jp-progress"'));assert(!body.includes('infolinks_main.js'));assert(!body.includes('bicea.org'));}
  if(path==='/advertise'){assert(body.includes('https://janpoll.in/advertise'));assert(body.includes('name="keywords"'));}
 }
 for(const path of ['/api/admin/upload-location','/api/admin/db-action']){const response=await fetch(base+path,{method:'POST',body:'{}',headers:{'content-type':'application/json'}});assert.equal(response.status,401,path);}
 const exportResponse=await fetch(base+'/api/admin/analytics/export');assert.equal(exportResponse.status,401);
 const admin=await fetch(base+'/admin/analytics',{redirect:'manual'});assert([303,307].includes(admin.status));assert.equal(admin.headers.get('x-robots-tag'),'noindex, nofollow');
 const legacy=await fetch(base+'/create?gpId=fixture&district=Jodhpur',{redirect:'manual'});assert([303,307].includes(legacy.status));assert(legacy.headers.get('location').includes('/create/rajasthan?'));
 assert.equal((await fetch(base+'/not-a-real-page-janpoll')).status,404);
 const health=await fetch(base+'/api/health');if(process.env.SMOKE_EXPECT_DB==='true')assert.equal(health.status,200);else assert([200,503].includes(health.status));
 console.log('HTTP smoke passed: public SEO, homepage card structure, no legacy ad scripts, unauthorized admin writes/exports, private redirects, legacy create redirect and unknown-route 404.');
 console.log('Database health status:',health.status,health.status===503?'(test database not connected; not a production-health pass)':'');
})().catch(error=>{console.error(error);process.exitCode=1;});
