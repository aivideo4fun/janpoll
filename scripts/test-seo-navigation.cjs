const fs=require('fs'),vm=require('vm'),ts=require('typescript'),React=require('react'),assert=require('node:assert/strict');
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,require:n=>n in mocks?mocks[n]:require(n),process,URL,URLSearchParams,console});return exports;}
const regions=load('src/lib/regions.ts'),seo=load('src/lib/site-seo.ts');
const rj=regions.getRegionByCode('RJ');assert.equal(regions.createHref(rj),'/create/rajasthan?state=rajasthan');assert.equal(regions.createHref(regions.getRegionByCode('MP')),'/create/public?state=madhya-pradesh');
const mocks={'next/navigation':{redirect:url=>{const error=new Error('Redirect');error.url=url;throw error;}},'@/lib/regions':regions,'./PublicCreateForm':()=>null};
const publicPage=load('src/app/create/public/page.tsx',mocks).default;
const dispatcher=load('src/app/create/page.tsx',mocks).default;
async function redirected(fn,params){try{await fn({searchParams:Promise.resolve(params)});assert.fail('Expected redirect');}catch(e){if(!e.url)throw e;return new URL(e.url,'https://janpoll.in');}}
function walk(node,visit){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(n=>walk(n,visit));return;}visit(node);if(node.props)walk(node.props.children,visit);}
(async()=>{
 for(const state of ['rajasthan','RJ']){const url=await redirected(publicPage,{state,gpId:'legacy-gp',districtId:'legacy-d'});assert.equal(url.pathname,'/create/rajasthan');assert.equal(url.searchParams.get('gpId'),'legacy-gp');assert.equal(url.searchParams.get('districtId'),'legacy-d');}
 const url=await redirected(dispatcher,{samitiId:'legacy-s',category:'mandal'});assert.equal(url.pathname,'/create/rajasthan');assert.equal(url.searchParams.get('samitiId'),'legacy-s');assert.equal(url.searchParams.get('category'),'mandal');
 const trending=[{code:'RJ',name:'राजस्थान',en:'Rajasthan',href:'/rajasthan',votes:100,activePolls:2}];
 const db={poll:{count:async()=>2,groupBy:async()=>[{stateCode:'RJ',_count:{_all:2}}]},pollOption:{aggregate:async()=>({_sum:{voteCount:100}})},user:{count:async()=>1}};
 const home=load('src/app/page.tsx',{'@/lib/home-ranking':{getTodayTopPolls:async()=>[]},'@/lib/state-trending':{getTrendingStates:async()=>trending},'@/components/HomeContent':()=>null,'next/link':()=>null,'@/lib/poll-utils':{isPollOpen:()=>true},'@/lib/db':{db},'@/lib/regions':regions,'@/components/JanPollHomeClient':{CountUp:()=>null,RegionPicker:()=>null},'./janpoll-home.css':{}});
 assert.equal(home.metadata.alternates.languages['en-IN'],'https://janpoll.in/en');assert(home.metadata.title.includes('पोल बनाएँ'));
 const tree=await home.default({searchParams:Promise.resolve({})});let trend;walk(tree,n=>{if(n.props?.['aria-labelledby']==='trending-states-title')trend=n;});assert(trend);let links=[];walk(trend,n=>{if(n.props?.href)links.push(n.props.href);});assert(links.includes('/rajasthan'));assert(!links.includes('/state/madhya-pradesh'));
 const english=load('src/app/en/page.tsx',{'next/link':()=>null,'@/lib/regions':regions,'@/lib/home-ranking':{getTodayTopPolls:async()=>[]},'@/lib/state-trending':{getTrendingStates:async()=>trending},'@/lib/site-seo':seo});
 assert.equal(english.metadata.alternates.canonical,'https://janpoll.in/en');assert.equal(english.metadata.alternates.languages['hi-IN'],'https://janpoll.in/');assert.equal((await english.default()).props.lang,'en');
 const guide=load('src/app/poll-banaye/page.tsx',{'next/link':()=>null,'@/lib/seo':load('src/lib/seo.ts'),'@/lib/site-seo':seo});assert(guide.metadata.alternates.canonical.endsWith('/poll-banaye'));
 assert(!seo.jsonLd({'text':'</script><script>bad</script>'}).includes('</script>'));
 console.log('SEO/navigation checks passed: real Hindi/English alternates, canonical guide, visible vote-ranked state section without empty states, JSON-LD escaping and Rajasthan redirect/context preservation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
