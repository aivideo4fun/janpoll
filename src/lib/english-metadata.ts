import type { Metadata } from 'next';
export function englishMetadata(title:string,description:string,path:string):Metadata {
  return {title:`${title} | JanPoll India`,description,keywords:['JanPoll India',title,'public opinion India'],alternates:{canonical:`https://janpoll.in${path}`},openGraph:{title,description,url:`https://janpoll.in${path}`,siteName:'JanPoll India',locale:'en_IN',type:'website'},twitter:{card:'summary',title,description}};
}
