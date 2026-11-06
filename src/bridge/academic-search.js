/** HTTP bridge to the existing Python acadsearch FastAPI server. Each provider
 * is queried separately, preserving independent result ranks for RRF.
 * Do not send DSH provider aliases directly to the Python service.
 */
const MAP={
 semantic_scholar:'semantic_scholar',pubmed_europepmc:'pubmed_europepmc',
 inspire_hep:'inspire',elsevier_scopus:'scopus',clarivate_wos:'wos',
 springer_nature:'springer',ieee_xplore:'ieee',
};
export function toPythonProvider(id){return id.startsWith('publisher:')?id.slice(10):(MAP[id]||id);}
export function createAcademicSearchBridge({baseUrl=process.env.ACADSEARCH_BASE_URL||'http://127.0.0.1:8000',fetchImpl=fetch}={}){
 const url=new URL('/v1/papers/search',baseUrl).toString();
 return async function search({provider,query,limit=20,year_min,year_max,open_access_only=false,signal}){
  const res=await fetchImpl(url,{
   method:'POST',headers:{'content-type':'application/json'},signal,
   body:JSON.stringify({query,providers:[toPythonProvider(provider)],limit:Math.max(1,Math.min(limit,50)),
     year_min,year_max,open_access_only,include_bibtex:false,sort:'relevance'})
  });
  if(!res.ok)throw new Error(`acadsearch HTTP ${res.status}: ${String(await res.text()).slice(0,300)}`);
  const payload=await res.json();
  if(!payload||!Array.isArray(payload.results))throw new Error('malformed acadsearch response');
  const expected=toPythonProvider(provider);
  if(!payload.providers_queried?.length || !payload.providers_queried.some(x=>
     x===expected||x===({scopus:'scopus',wos:'clarivate_wos',springer:'springer_nature',ieee:'ieee_xplore',inspire:'inspire_hep'}[expected]||''))) {
    throw new Error(`provider ${provider} was not executed by acadsearch; unsupported or missing adapter`);
  }
  return {results:payload.results,warnings:payload.warnings||[]};
 };
}
