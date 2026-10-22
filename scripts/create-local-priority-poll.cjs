#!/usr/bin/env node
'use strict';
const {PrismaClient}=require('@prisma/client');const db=new PrismaClient();
const id='aed4d5d2-6280-47d0-93a2-e4d2049345b1';
async function main(){
 const choices=['पेयजल और पानी की आपूर्ति','सड़कें और मरम्मत','स्कूल और शिक्षा','स्वास्थ्य सेवाएँ','रोज़गार और कौशल','सफाई और कचरा प्रबंधन','बिजली की आपूर्ति','सार्वजनिक परिवहन','अन्य स्थानीय मुद्दा'];
 // Upsert is idempotent: never resets votes, edits options or reopens an existing poll.
 const poll=await db.poll.upsert({where:{id},update:{},create:{id,question:'आपके क्षेत्र में सबसे पहले किस मुद्दे पर काम होना चाहिए?',creatorName:'JanPoll Team',scope:'NATIONAL',categoryType:'non-political',topic:'local',electionType:null,requiresLogin:true,deadlineDays:60,active:true,termsAgreed:true,termsVersion:'local-priorities-2026',termsAcceptedAt:new Date(),options:{create:choices.map((text,order)=>({text,order,voteCount:0}))}}});
 console.log('Local issues poll ready (existing votes preserved): https://janpoll.in/poll/'+poll.id);
}
main().catch(e=>{console.error('Issue poll setup failed:',e.code||e.name);process.exitCode=1}).finally(()=>db.$disconnect());
