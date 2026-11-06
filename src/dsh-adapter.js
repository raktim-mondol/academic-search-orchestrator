/** DSH's literature-search.js already exports runSource(). Pass it as a
 * callback when integrating this library; no second DSH plugin is required.
 * Other standalone tools (Consensus/Elicit) need explicit adapters.
 */
const SOURCE_MAP={
 openalex:'openalex',semantic_scholar:'s2',crossref:'crossref',
 arxiv:'arxiv',pubmed_europepmc:'pubmed',inspire_hep:'inspire',
 nasa_ads:'ads',elsevier_scopus:'scopus',clarivate_wos:'wos',
 doaj:'doaj',springer_nature:'springer',ieee_xplore:'ieee'
};
export function createDshAdapter(runSource){
 if(typeof runSource!=='function')throw new Error('runSource callback required');
 return async({provider,query,limit=20,year_min,year_max,open_access_only=false,signal})=>{
   const source=provider.startsWith('publisher:')?provider:SOURCE_MAP[provider];
   if(!source)throw new Error(`No runSource adapter for ${provider}`);
   const value=await runSource(source,{query,perSource:limit,yearMin:year_min,yearMax:year_max,openAccessOnly:open_access_only,signal});
   if(value?.error)throw new Error(value.error);
   return {results:value?.results||[],warnings:value?.warnings||[]};
 };
}
export function canDshRun(provider){return provider.id.startsWith('publisher:')||Boolean(SOURCE_MAP[provider.id]);}
