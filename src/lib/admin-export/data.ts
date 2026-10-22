import 'server-only';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { REGIONS } from '@/lib/regions';
import { dateBounds, indiaTimestamp, normalizeEmail, normalizePhone } from './format';
export type ExportKind = 'support' | 'creators';
export type ExportData = { headers: string[]; rows: (string | number)[][]; sourceRecords: number; view: string };
const BATCH = 1000;
const MAX_RECORDS = 200000;
export class ExportInputError extends Error {}
function fail(message: string): never { throw new ExportInputError(message); }
function options(params: URLSearchParams) {
  const view = params.get('view') || 'merged';
  if (!['merged','records'].includes(view)) fail('Choose merged contacts or individual records.');
  const q = (params.get('q') || '').trim().toLowerCase();
  if (q.length > 150) fail('Search is limited to 150 characters.');
  const email = params.get('email') || 'all';
  if (!['all','available','missing'].includes(email)) fail('Invalid email filter.');
  let createdAt;
  try { createdAt = dateBounds(params.get('from') || '', params.get('to') || ''); }
  catch (error) { fail((error as Error).message); }
  const number = (key: string, fallback: number) => {
    const text = params.get(key); if (!text) return fallback;
    if (!/^\d+$/.test(text)) fail('Poll counts must be whole numbers.');
    const n = Number(text); if (n < 1 || n > MAX_RECORDS) fail(`Poll counts must be between 1 and ${MAX_RECORDS}.`); return n;
  };
  const min = number('minPolls',1), max = number('maxPolls',MAX_RECORDS);
  if (min > max) fail('Minimum poll count cannot exceed maximum poll count.');
  const state = params.get('state') || '';
  if (state && state !== 'UNMAPPED' && !REGIONS.some(region => region.code === state)) fail('Unknown state code.');
  return { view, q, email, createdAt, min, max, state, includeMessages:params.get('includeMessages') === '1' };
}
function maxCheck(count: number) { if (count > MAX_RECORDS) fail('This export exceeds 200,000 source records. Narrow the date/state filters and export separate periods. Nothing was truncated.'); }
function join(values: Iterable<string>) { return [...new Set(values)].filter(Boolean).sort((a,b)=>a.localeCompare(b)).join(' | '); }
function emailAllowed(value: string, filter: string) { return filter === 'all' || (filter === 'available' ? !!value : !value); }
const matching = (query: string, fields: string[]) => !query || fields.some(field=>field.toLowerCase().includes(query));
export async function creatorExport(params: URLSearchParams): Promise<ExportData> {
  const opts = options(params);
  const where: Prisma.PollWhereInput = { ...(opts.createdAt ? {createdAt:opts.createdAt} : {}), ...(opts.state ? {stateCode:opts.state === 'UNMAPPED' ? null : opts.state} : {}) };
  const records: {id:string;creatorName:string|null;creatorEmail:string|null;creatorGuestHash:string|null;stateCode:string|null;question:string;createdAt:Date;active:boolean}[] = [];
  let lastId = '';
  while (true) {
    const batch = await db.poll.findMany({where:{AND:[where,...(lastId?[{id:{gt:lastId}}]:[])]},orderBy:{id:'asc'},take:BATCH,select:{id:true,creatorName:true,creatorEmail:true,creatorGuestHash:true,stateCode:true,question:true,createdAt:true,active:true}});
    if (!batch.length) break;
    records.push(...batch); maxCheck(records.length); lastId=batch[batch.length-1].id;
    if (batch.length < BATCH) break;
  }
  type Group = {email:string;identity:string;names:Set<string>;polls:typeof records};
  const groups = new Map<string,Group>();
  for (const record of records) {
    const email = normalizeEmail(record.creatorEmail);
    const key = email ? 'email:'+email : record.creatorGuestHash ? 'legacy:'+record.creatorGuestHash : 'unknown:'+record.id;
    let group = groups.get(key);
    if (!group) { group={email,identity:email?'email':record.creatorGuestHash?'legacy_browser':'unavailable',names:new Set(),polls:[]}; groups.set(key,group); }
    if (record.creatorName?.trim()) group.names.add(record.creatorName.trim());
    group.polls.push(record);
  }
  const selected = [...groups.values()].filter(group => emailAllowed(group.email,opts.email) && group.polls.length >= opts.min && group.polls.length <= opts.max && matching(opts.q,[group.email,...group.names]));
  selected.sort((a,b)=>b.polls.length-a.polls.length || a.email.localeCompare(b.email) || a.polls[0].id.localeCompare(b.polls[0].id));
  if (opts.view === 'records') return {view:opts.view,sourceRecords:records.length,headers:['creator_name','creator_email','identity_source','creator_poll_count_in_filters','poll_id','question','state_code','created_at_ist','active_flag','poll_url'],rows:selected.flatMap(group=>group.polls.map(record=>[record.creatorName || '',group.email,group.identity,group.polls.length,record.id,record.question,record.stateCode || '',indiaTimestamp(record.createdAt),record.active?'true':'false',`https://janpoll.in/poll/${encodeURIComponent(record.id)}`]))};
  return {view:opts.view,sourceRecords:records.length,headers:['creator_names','creator_email','identity_source','poll_count_in_filters','state_codes','first_poll_at_ist','last_poll_at_ist','example_poll_id'],rows:selected.map(group=>{
    const ordered=group.polls.slice().sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime());
    return [join(group.names),group.email,group.identity,group.polls.length,join(group.polls.map(p=>p.stateCode || 'UNMAPPED')),indiaTimestamp(ordered[0].createdAt),indiaTimestamp(ordered[ordered.length-1].createdAt),ordered[0].id];
  })};
}
export async function supportExport(params: URLSearchParams): Promise<ExportData> {
  const opts=options(params);
  const records:{id:string;name:string;email:string;whatsapp:string|null;message?:string;createdAt:Date}[]=[];
  let lastId='';
  while (true) {
    const batch=await db.contactMessage.findMany({where:{...(opts.createdAt?{createdAt:opts.createdAt}:{}),...(lastId?{id:{gt:lastId}}:{})},orderBy:{id:'asc'},take:BATCH,select:{id:true,name:true,email:true,whatsapp:true,message:opts.view==='records'&&opts.includeMessages,createdAt:true}});
    if (!batch.length) break; records.push(...batch);maxCheck(records.length);lastId=batch[batch.length-1].id;if(batch.length<BATCH)break;
  }
  type Group={email:string;names:Set<string>;phones:Set<string>;messages:typeof records};
  const groups=new Map<string,Group>();
  for(const record of records){
    const email=normalizeEmail(record.email),phone=normalizePhone(record.whatsapp);
    const key=email?'email:'+email:'record:'+record.id;
    let group=groups.get(key);if(!group){group={email,names:new Set(),phones:new Set(),messages:[]};groups.set(key,group);}
    if(record.name.trim())group.names.add(record.name.trim());if(phone)group.phones.add(phone);group.messages.push(record);
  }
  const selected=[...groups.values()].filter(group=>emailAllowed(group.email,opts.email)&&matching(opts.q,[group.email,...group.names,...group.phones]));
  selected.sort((a,b)=>b.messages.length-a.messages.length||a.email.localeCompare(b.email));
  if(opts.view==='records')return {view:opts.view,sourceRecords:records.length,headers:['message_id','name','email','phone_whatsapp','received_at_ist',...(opts.includeMessages?['message']:[])],rows:selected.flatMap(group=>group.messages.map(record=>[record.id,record.name,group.email,normalizePhone(record.whatsapp),indiaTimestamp(record.createdAt),...(opts.includeMessages?[record.message || '']:[])]))};
  return {view:opts.view,sourceRecords:records.length,headers:['names','email','phones_whatsapp','message_count','first_received_at_ist','last_received_at_ist'],rows:selected.map(group=>{
    const ordered=group.messages.slice().sort((a,b)=>a.createdAt.getTime()-b.createdAt.getTime());
    return [join(group.names),group.email,join(group.phones),ordered.length,indiaTimestamp(ordered[0].createdAt),indiaTimestamp(ordered[ordered.length-1].createdAt)];
  })};
}
export function exportData(kind: ExportKind, params: URLSearchParams) { return kind === 'creators' ? creatorExport(params) : supportExport(params); }
