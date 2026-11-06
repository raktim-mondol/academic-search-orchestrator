/** Never claim a paper supports a sentence based only on a DOI or abstract.
 * A separate verified evidence-passages workflow must populate claim support.
 */
export function citationEnvelope(paper){
 const ref={canonical_id:paper.canonical_id,title:paper.title,year:paper.year,
   doi:paper.doi,authors:paper.authors,source_providers:[...new Set(paper.provenance.map(p=>p.provider))],
   link:paper.doi?`https://doi.org/${paper.doi}`:paper.landing_page_url,
   bibliographic_status:'not_checked',claim_support_status:'not_checked',
   evidence_passages:[]};
 return ref;
}
export function validateClaimCitations(claims,papers){
 const ids=new Set(papers.map(p=>p.canonical_id));
 return claims.map((claim)=>({
   ...claim,
   citation_status:Array.isArray(claim.citation_ids)&&claim.citation_ids.length&&claim.citation_ids.every(id=>ids.has(id))
     ?'identifiers_resolved':'invalid_or_missing_citations',
   claim_support_status:'not_checked'
 }));
}
