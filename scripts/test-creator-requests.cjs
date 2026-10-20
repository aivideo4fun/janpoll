const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,mocks){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>{if(n in mocks)return mocks[n];throw Error('Unexpected import '+n);},process,console,Date});return exports;}
(async()=>{
 let owner={creatorEmail:'creator@example.invalid'},admin=false,calls=[];
 const db={poll:{updateMany:async args=>{calls.push(['update',args]);return {count:1};},deleteMany:async args=>{calls.push(['delete',args]);return {count:1};}}};
 const creator=load('src/app/my-polls/actions.ts',{'@/lib/db':{db},'@/lib/polls/owner':{ownerWhere:async()=>owner},'next/cache':{revalidatePath:()=>{}}});
 const form=new FormData();form.set('reference','JP-test');
 for(const fn of ['requestDeletion','requestDeactivation','deactivateOwnPoll']){calls=[];await creator[fn](form);assert.equal(calls.length,1);const data=calls[0][1].data;assert(!('active' in data));assert.equal(calls[0][1].where.creatorEmail,owner.creatorEmail);assert.equal(data.deletionStatus,fn==='requestDeletion'?'REQUESTED':'DEACTIVATION_REQUESTED');assert(calls[0][1].where.deletionStatus.in);}
 owner=null;await assert.rejects(()=>creator.requestDeactivation(form));
 const review=load('src/app/admin/actions/adminActions.ts',{'@/lib/db':{db},'@/lib/voter':{},'@/lib/rate-limit':{},'next/cache':{revalidatePath:()=>{}},'next/navigation':{},'@/lib/poll-utils':{},'@/lib/admin-auth':{isAdmin:async()=>admin}}).reviewCreatorRequest;
 const decision=new FormData();decision.set('pollId','poll');decision.set('requestType','DEACTIVATION_REQUESTED');decision.set('decision','approve');calls=[];await assert.rejects(()=>review(decision));assert.equal(calls.length,0);
 admin=true;await review(decision);assert.equal(calls[0][1].data.active,false);assert.equal(calls[0][1].where.deletionStatus,'DEACTIVATION_REQUESTED');
 calls=[];decision.set('decision','reject');await review(decision);assert.equal(calls[0][1].data.deletionStatus,'REJECTED');assert(!('active' in calls[0][1].data));
 calls=[];decision.set('requestType','REQUESTED');decision.set('decision','approve');await review(decision);assert.equal(calls[0][0],'delete');assert.equal(calls[0][1].where.deletionStatus,'REQUESTED');
 decision.set('requestType','NONE');await assert.rejects(()=>review(decision));
 console.log('Creator request checks passed: owner-scoped requests only, legacy deactivation action cannot deactivate, pending request protection, admin-only approve/reject and conditional deletion.');
})().catch(e=>{console.error(e);process.exitCode=1;});
