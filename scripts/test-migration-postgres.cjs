// Optional integration check using the PostgreSQL engine embedded in PGlite.
// Install it OUTSIDE the app and set PGLITE_MODULE to its module path.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
(async()=>{
 const db=new PGlite();
 try{
  await db.exec(fs.readFileSync('scripts/fixtures/live-schema.sql','utf8'));
  await db.exec(`
   INSERT INTO "District" (id,"nameEn","nameHi") VALUES ('fixture-d','Fixture District','परीक्षण जिला');
   INSERT INTO "Tehsil" (id,"nameEn","nameHi","districtId") VALUES ('fixture-t','Fixture Tehsil','परीक्षण तहसील','fixture-d');
   INSERT INTO "PanchayatSamiti" (id,"nameEn","nameHi","districtId","tehsilId") VALUES ('fixture-s','Fixture Samiti','परीक्षण समिति','fixture-d','fixture-t');
   INSERT INTO "GramPanchayat" (id,"nameEn","nameHi","districtId","samitiId") VALUES ('fixture-g','Fixture GP','परीक्षण पंचायत','fixture-d','fixture-s');
   INSERT INTO "Poll" (id,question,"districtId","districtName","samitiId","samitiName","gramPanchayatId","gramPanchayatName","updatedAt") VALUES ('fixture-p','Migration fixture question','fixture-d','परीक्षण जिला','fixture-s','परीक्षण समिति','fixture-g','परीक्षण पंचायत',NOW());
   INSERT INTO "PollOption" (id,"pollId",text,"voteCount") VALUES ('fixture-o1','fixture-p','Option A',2),('fixture-o2','fixture-p','Option B',1);
   INSERT INTO "Vote" (id,"pollId","optionId","anonymousUserId") VALUES ('fixture-v1','fixture-p','fixture-o1','fixture-a1'),('fixture-v2','fixture-p','fixture-o1','fixture-a2'),('fixture-v3','fixture-p','fixture-o2','fixture-a3');
  `);
  // Real production audit found duplicate slugs. They must survive unchanged.
  await db.exec(`UPDATE "Poll" SET slug='shared-legacy-slug' WHERE id='fixture-p';
   INSERT INTO "Poll" (id,question,slug,"districtId","updatedAt") VALUES ('fixture-p2','Second legacy poll','shared-legacy-slug','fixture-d',NOW());`);
  const originalSlugs=await db.query('SELECT id,slug FROM "Poll" ORDER BY id');
  const original=await db.query('SELECT p.id,p.question,o.id AS option_id,o.text,o."voteCount" FROM "Poll" p JOIN "PollOption" o ON o."pollId"=p.id ORDER BY o.id');
  await db.exec(fs.readFileSync('deploy/rds-upgrade-review.sql','utf8'));
  const after=await db.query('SELECT p.id,p.question,o.id AS option_id,o.text,o."voteCount" FROM "Poll" p JOIN "PollOption" o ON o."pollId"=p.id ORDER BY o.id');
  assert.deepEqual(after.rows,original.rows);
  assert.deepEqual((await db.query('SELECT id,slug FROM "Poll" ORDER BY id')).rows,originalSlugs.rows);
  assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM "Vote"')).rows[0].count,3);
  assert.equal((await db.query('SELECT "creatorReference","stateCode" FROM "Poll"')).rows[0].creatorReference,null);
  const stateSql=fs.readFileSync('src/lib/analytics.ts','utf8').match(/`WITH totals[^`]+`/)[0].slice(1,-1);
  const state=await db.query(stateSql);assert.equal(state.rows[0].state,'RJ (legacy)');assert.equal(Number(state.rows[0].votes),3);
  await db.exec(`INSERT INTO "Article" (id,slug,title,author,summary,content,sources,"updatedAt") VALUES ('fixture-article','fixture-article','Fixture title','Test author','Fixture summary','Fixture body','',NOW());`);
  assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM "Article" WHERE published=true')).rows[0].count,0);
  for(const file of ['creator-reference.sql','content-admin.sql','release-analytics.sql','visual-content.sql'])await db.exec(fs.readFileSync('prisma/updates/'+file,'utf8'));
  let duplicate=false;try{await db.exec(`INSERT INTO "Vote" (id,"pollId","optionId","anonymousUserId") VALUES ('fixture-duplicate','fixture-p','fixture-o2','fixture-a1')`);}catch{duplicate=true;}assert.equal(duplicate,true);
  assert.equal((await db.query('SELECT COUNT(*)::int AS count FROM "Vote"')).rows[0].count,3);
  console.log('PostgreSQL-engine fixture checks passed: old schema -> reviewed release SQL, duplicate legacy slugs and poll/option/3-vote preservation, legacy-state analytics, draft visibility, rerunnable local additions and duplicate-vote constraint.');
 }finally{await db.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
