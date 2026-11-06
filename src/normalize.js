import {createHash} from 'node:crypto';
export function doi(v){
 const s=String(v||'').trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'').replace(/[.,;]+$/,'').toLowerCase();
 return /^10\.\d{4,9}\/.+/.test(s)?s:null;
}
export function titleKey(s){return String(s||'').normalize('NFKD').replace(/<[^>]*>/g,' ').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export function arxiv(v){
 const s=String(v||'').replace(/^arxiv:/i,'').replace(/^https?:\/\/arxiv.org\/(abs|pdf)\//i,'').replace(/\.pdf$/i,'');
 const m=s.match(/(\d{4}\.\d{4,5}|[a-z-]+(?:\.[a-z-]+)?\/\d{7})(?:v\d+)?/i);
 return m?m[1].toLowerCase():null;
}
export function firstAuthor(p){
 const x=p.authors?.[0];
 return titleKey(typeof x==='string'?x:(x?.name||[x?.given,x?.family].filter(Boolean).join(' '))||'').split(' ').at(-1)||null;
}
export function normalizePaper(p,source){
 const out={
  id:p.id??p.source_id??null,source, title:String(p.title||'').trim(),
  doi:doi(p.doi),pmid:p.pmid?String(p.pmid):null,pmcid:p.pmcid?String(p.pmcid).toUpperCase():null,
  arxiv_id:arxiv(p.arxiv_id),openalex_id:p.openalex_id??null,
  semantic_scholar_id:p.semantic_scholar_id??p.s2_id??null,
  authors:Array.isArray(p.authors)?p.authors:[],
  year:Number.isInteger(p.year)?p.year:null,
  type:p.publication_type??p.type??null,
  abstract:p.abstract??null,venue:p.journal?.name??p.venue??null,
  citation_count:Number.isFinite(p.citation_count)?p.citation_count:null,
  landing_page_url:p.landing_page_url??p.url??null,
  pdf_url:p.pdf_url??null,bibtex:p.bibtex??null,
  published_doi:doi(p.published_doi??p.relations?.isPreprintOf??null),
  is_retracted:Boolean(p.is_retracted),
  original:p
 };
 return out;
}
export function canonicalId(p){
 const stable=p.doi?`doi:${p.doi}`:p.pmid?`pmid:${p.pmid}`:p.arxiv_id?`arxiv:${p.arxiv_id}`:`title:${titleKey(p.title)}|${p.year??'?'}|${firstAuthor(p)||'?'}`;
 return 'paper_'+createHash('sha256').update(stable).digest('hex').slice(0,20);
}
