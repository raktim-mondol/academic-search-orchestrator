import {routeQuery} from './route.js';
import {dedupeAndRank} from './dedupe.js';
import {citationEnvelope} from './citations.js';
/**
 * Provide `searchProvider` for each enabled paper-search provider. The optional
 * `generateAnswer` callback is the DSH session LLM; never use Jev for prose.
 * `generateAnswer` receives constrained, canonical references and must return
 * claims with citations. Bibliographic and claim checks remain separate.
 */
export async function searchResearch({query,mode='jev',sources=null,limit=20,perProvider=30,
 maxProviders=5,credentials=process.env,searchProvider,canExecute=null,jevOptions={},
 generateAnswer=null,signal,...filters}={}){
 if(typeof searchProvider!=='function')throw new Error('searchProvider callback required');
 const routing=await routeQuery({query,mode,sources,maxProviders,credentials,canExecute,jevOptions});
 const settled=await Promise.allSettled(routing.selected_providers.map(async provider=>{
   const value=await searchProvider({provider,query,limit:perProvider,signal,...filters});
   if(!Array.isArray(value?.results))throw new Error(`invalid results from ${provider}`);
   return {source:provider,results:value.results,warnings:value.warnings||[]};
 }));
 const groups=[],failures=[];
 settled.forEach((item,i)=>{
  if(item.status==='fulfilled')groups.push(item.value);
  else failures.push({provider:routing.selected_providers[i],error:item.reason?.message||String(item.reason)});
 });
 const merged=dedupeAndRank(groups);
 const papers=merged.papers.slice(0,limit);
 const bibliography=papers.map(citationEnvelope);
 let answer=null;
 if(generateAnswer)answer=await generateAnswer({query,papers,bibliography});
 return {query,routing,counts:Object.fromEntries(groups.map(g=>[g.source,g.results.length])),
  failures,total_records:merged.total_records,total_unique:merged.total_unique,
  duplicates_collapsed:merged.duplicates_collapsed,papers,bibliography,answer,
  warning:answer?'Answer callback supplied; independently validate claim-level evidence before treating citations as verified.':null};
}
