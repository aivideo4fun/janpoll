// Optional PostgreSQL-engine fixture test. Never connects to live RDS.
const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>n in mocks?mocks[n]:require(n),process,console});return exports;}
(async()=>{const db=new PGlite();try{
 await db.exec(fs.readFileSync('scripts/fixtures/live-schema.sql','utf8'));await db.exec(fs.readFileSync('deploy/rds-upgrade-review.sql','utf8'));
 await db.exec(`INSERT INTO "Poll" (id,question,"stateCode","districtName",active,"updatedAt") VALUES ('rj-old','Fixture question',NULL,'Fixture district',true,NOW()),('rj-new','Fixture question','RJ',NULL,false,NOW()),('mp','Fixture question','MP',NULL,true,NOW()),('br','Fixture question','BR',NULL,true,NOW()),('national','Fixture question',NULL,NULL,true,NOW());
 INSERT INTO "PollOption" (id,"pollId",text,"voteCount") VALUES ('a','rj-old','A',10),('b','rj-old','B',5),('c','rj-new','A',5),('d','mp','A',100),('e','br','A',0),('f','national','A',1000);`);
 const regions=load('src/lib/regions.ts');const helper=load('src/lib/state-trending.ts',{'server-only':{},'next/cache':{unstable_cache:fn=>fn},'@/lib/db':{db:{$queryRaw:async(strings)=> (await db.query(strings.join(''))).rows}},'@/lib/regions':regions});
 let states=await helper.getTrendingStates();assert.equal(states.length,2);assert.equal(states[0].code,'MP');assert.equal(states[0].votes,100);assert.equal(states[1].code,'RJ');assert.equal(states[1].votes,20);assert.equal(states[1].activePolls,1);assert.equal(states[1].href,'/rajasthan');
 await db.exec(`UPDATE "PollOption" SET "voteCount"=0 WHERE "pollId"='mp'`);states=await helper.getTrendingStates();assert.equal(states.length,1);assert.equal(states[0].code,'RJ');
 console.log('State trending PostgreSQL fixture passed: vote ordering, legacy Rajasthan inclusion, distinct active poll counts, national/zero-vote exclusion and Rajasthan-only display.');
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
