import type { Metadata } from 'next';
export function pageMetadata(title:string,description:string,path:string,keywords:string[]=[]):Metadata {
 return {title,description,keywords:['JanPoll India','जनमत पोल','public opinion India',...keywords],alternates:{canonical:`https://janpoll.in${path}`},openGraph:{title,description,url:`https://janpoll.in${path}`,siteName:'JanPoll India',locale:'hi_IN',type:'website'},twitter:{card:'summary',title,description}};
}
