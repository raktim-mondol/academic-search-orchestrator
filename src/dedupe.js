import {normalizePaper,titleKey,firstAuthor,canonicalId} from './normalize.js';
import {getProvider} from './provider-registry.js';

/** Candidate merging is conservative. Different non-empty DOIs are NEVER merged.
 * Preprint->journal links are recorded as relations, not collapsed identities.
 * Every raw provider observation is retained in `provenance`.
 */
function sameRecord(a,b){
 if(a.doi&&b.doi){if(a.doi!==b.doi)return false;return !titleKey(a.title)||!titleKey(b.title)||titleKey(a.title)===titleKey(b.title);}
 if(a.doi&&b.doi===null||b.doi&&a.doi===null){
   // No DOI on one side: require an exact strong identifier agreement or
   // strict title+year+author agreement.
 }
 if(a.pmid&&b.pmid&&a.pmid===b.pmid)return !(a.doi&&b.doi&&a.doi!==b.doi);
 if(a.pmcid&&b.pmcid&&a.pmcid===b.pmcid)return !(a.doi&&b.doi&&a.doi!==b.doi);
 if(a.arxiv_id&&b.arxiv_id&&a.arxiv_id===b.arxiv_id)return !(a.doi&&b.doi&&a.doi!==b.doi);
 if(a.openalex_id&&b.openalex_id&&a.openalex_id===b.openalex_id)return !(a.doi&&b.doi&&a.doi!==b.doi);
 if(a.semantic_scholar_id&&b.semantic_scholar_id&&a.semantic_scholar_id===b.semantic_scholar_id)return !(a.doi&&b.doi&&a.doi!==b.doi);
 const ta=titleKey(a.title),tb=titleKey(b.title);
 return Boolean(ta&&ta===tb&&a.year&&a.year===b.year&&firstAuthor(a)&&firstAuthor(a)===firstAuthor(b));
}
function fill(target,source){
 for(const k of ['doi','pmid','pmcid','arxiv_id','openalex_id','semantic_scholar_id','year','type','venue','landing_page_url','pdf_url','bibtex','published_doi']){
   if(target[k]==null&&source[k]!=null)target[k]=source[k];
 }
 if((source.abstract?.length||0)>(target.abstract?.length||0))target.abstract=source.abstract;
 if((source.authors?.length||0)>(target.authors?.length||0))target.authors=source.authors;
 if((source.citation_count??-1)>(target.citation_count??-1))target.citation_count=source.citation_count;
 target.is_retracted ||= source.is_retracted;
}
export function dedupeAndRank(groups,{rrfK=60}={}){
 const papers=[]; let totalRecords=0;
 for(const group of groups){
   const provider=getProvider(group.source);const family=provider?.family||group.source;
   for(const [rank,raw] of (group.results||[]).entries()){
     if(!raw?.title)continue;
     totalRecords++;
     const p=normalizePaper(raw,group.source);
     let target=papers.find(existing=>sameRecord(existing,p));
     if(!target){
       target={...p,provenance:[],provider_families:{},rrf_score:0,version_relations:[]};papers.push(target);
     }else fill(target,p);
     target.provenance.push({provider:group.source,family,rank:rank+1,source_id:p.id,
       doi:p.doi,title:p.title,year:p.year});
     // Correlated Crossref-member searches count as one family per paper.
     const score=1/(rrfK+rank+1);
     target.provider_families[family]=Math.max(target.provider_families[family]||0,score);
   }
 }
 for(const paper of papers){
   paper.rrf_score=Object.values(paper.provider_families).reduce((a,b)=>a+b,0);
   paper.canonical_id=canonicalId(paper);
   delete paper.original;
 }
 // Version relation only when an explicit published DOI relation exists.
 const byDoi=new Map(papers.filter(x=>x.doi).map(x=>[x.doi,x]));
 for(const paper of papers){
   if(paper.published_doi&&paper.doi!==paper.published_doi){
     const target=byDoi.get(paper.published_doi);
     paper.version_relations.push({type:'is_preprint_of',doi:paper.published_doi,
       canonical_id:target?.canonical_id??null,verified_by:'provider_metadata'});
   }
 }
 papers.sort((a,b)=>b.rrf_score-a.rrf_score||(b.citation_count??0)-(a.citation_count??0)||a.title.localeCompare(b.title));
 return {total_records:totalRecords,total_unique:papers.length,duplicates_collapsed:totalRecords-papers.length,papers};
}
