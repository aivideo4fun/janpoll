import 'server-only';
import { db } from '@/lib/db';
export function normalizeMobile(value: string): string | null {
  const raw=value.trim(); if(!raw)return null;
  if(!/^[+\d ()-]+$/.test(raw))throw Error('Invalid mobile');
  const digits=raw.replace(/\D/g,'');
  if(!raw.startsWith('+') && /^[6-9]\d{9}$/.test(digits))return '+91'+digits;
  if(/^\+?[1-9]\d{7,14}$/.test(raw.replace(/[ ()-]/g,'')) && (raw.startsWith('+') || /^91[6-9]\d{9}$/.test(digits)))return '+'+digits;
  throw Error('Invalid mobile');
}
export async function readMobile(userId:string) {
  const rows=await db.$queryRaw<Array<{mobile:string|null}>>`SELECT mobile FROM "User" WHERE id = ${userId}`;
  return rows[0]?.mobile || '';
}
