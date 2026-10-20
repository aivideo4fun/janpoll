export const HOME_LANGUAGES = { 'hi-IN': 'https://janpoll.in/', 'en-IN': 'https://janpoll.in/en', 'x-default': 'https://janpoll.in/' };
export function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
export const SITE_GRAPH = {
 '@context':'https://schema.org',
 '@graph':[
  {'@type':'Organization','@id':'https://janpoll.in/#organization',name:'JanPoll India',alternateName:'JanPoll',url:'https://janpoll.in/',logo:'https://janpoll.in/logo.png',sameAs:['https://t.me/janpollindia','https://instagram.com/janpoll.in','https://twitter.com/janpollindia']},
  {'@type':'WebSite','@id':'https://janpoll.in/#website',name:'JanPoll India',alternateName:'JanPoll',url:'https://janpoll.in/',inLanguage:['hi-IN','en-IN'],publisher:{'@id':'https://janpoll.in/#organization'}}
 ]
};
