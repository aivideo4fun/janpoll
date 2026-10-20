// Run with the intended production environment loaded. No secrets are printed.
const { PrismaClient }=require('@prisma/client');
async function main(){
 const errors=[];const env=process.env;
 for(const key of ['DATABASE_URL','NEXTAUTH_SECRET','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','ADMIN_USER','ADMIN_PASS','ADMIN_SECRET','VOTE_SALT'])if(/REPLACE|CHANGE_ME|RDS_HOST/.test(env[key]||''))errors.push(key+' still contains a placeholder.');
 if(!env.TRUSTED_IP_HEADER)errors.push('Review and configure the trusted client-IP header behind the reverse proxy.');
 if(Number(process.versions.node.split('.')[0])<22)errors.push('Use Node.js 22 or newer supported LTS.');
 if(env.NODE_ENV!=='production')errors.push('NODE_ENV must be production.');
 if(env.ENABLE_DEV_LOGIN==='true')errors.push('ENABLE_DEV_LOGIN must be false.');
 if(!/^https:\/\//.test(env.NEXTAUTH_URL||''))errors.push('NEXTAUTH_URL must use HTTPS.');
 if(!env.NEXTAUTH_SECRET||env.NEXTAUTH_SECRET.length<32)errors.push('NEXTAUTH_SECRET must be a unique random secret (32+ characters).');
 if(!env.ADMIN_SECRET||env.ADMIN_SECRET.length<32)errors.push('ADMIN_SECRET must be a separate random secret (32+ characters).');
 if(env.ADMIN_SECRET===env.NEXTAUTH_SECRET)errors.push('Admin and NextAuth secrets must differ.');
 if(!env.ADMIN_PASS||env.ADMIN_PASS.length<12)errors.push('Use a unique admin password of at least 12 characters.');
 if(!env.ADMIN_USER)errors.push('ADMIN_USER missing.');
 if(!env.VOTE_SALT||env.VOTE_SALT.length<32)errors.push('VOTE_SALT missing or too short.');
 if(!/\.apps\.googleusercontent\.com$/.test(env.GOOGLE_CLIENT_ID||''))errors.push('Configure a real Google OAuth client ID, not a callback URL.');
 if(!env.GOOGLE_CLIENT_SECRET)errors.push('GOOGLE_CLIENT_SECRET missing.');
 if(env.REQUIRE_LOGIN_FOR_ALL_VOTES!=='true')errors.push('Production rollout requires REQUIRE_LOGIN_FOR_ALL_VOTES=true.');
 if(env.NEXT_PUBLIC_ADS_ENABLED==='true'){
  if(!/^ca-pub-\d+$/.test(env.NEXT_PUBLIC_ADSENSE_CLIENT||'')||!/^\d+$/.test(env.NEXT_PUBLIC_ADSENSE_SLOT||''))errors.push('Valid approved AdSense client/slot missing.');
  if(env.ADS_CONSENT_REVIEWED!=='true')errors.push('Advertising consent/CMP setup must be reviewed before enabling ads.');
 }
 let schema='public';try{const url=new URL(env.DATABASE_URL||'');if(!['postgres:','postgresql:'].includes(url.protocol))errors.push('DATABASE_URL must be PostgreSQL.');schema=url.searchParams.get('schema')||'public';if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&!['require','verify-full'].includes(url.searchParams.get('sslmode')))errors.push('Configure encrypted RDS connection settings and review CA validation.');}catch{errors.push('DATABASE_URL missing/invalid.');}
 if(errors.length){console.error(errors.map(e=>'- '+e).join('\n'));process.exitCode=1;return;}
 const db=new PrismaClient();try{
  await db.$queryRaw`SELECT 1`;
  const columns=await db.$queryRaw`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=${schema}`;
  const found=new Set(columns.map(c=>c.table_name+'.'+c.column_name));
  const required=['Poll.stateCode','Poll.scope','Poll.requiresLogin','Poll.shareCode','Poll.creatorReference','Poll.creatorGuestHash','Vote.userId','User.email','Article.published','Article.coverImage','Article.coverAlt','Announcement.active','Announcement.ticker','Announcement.tickerOrder','Announcement.tickerSpeed','Poll.termsAgreed','Poll.deletionStatus','Poll.deletionRequestedAt','RateLimitBucket.key','VoteAttempt.outcome','TrafficEvent.sessionHash'];
  const missing=required.filter(key=>!found.has(key));if(missing.length)throw new Error('Schema fields missing: '+missing.join(', '));
  console.log('Production environment and required database fields passed. This does not validate real OAuth callbacks, ad approval, or old-link/data reconciliation.');
 }catch(error){console.error(error.message.startsWith('Schema fields missing:')?error.message:'Database preflight failed. Check connection, migration and TLS settings.');process.exitCode=1;}finally{await db.$disconnect();}
}
main().catch(()=>{console.error('Preflight failed.');process.exitCode=1;});
