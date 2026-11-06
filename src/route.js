import {listProviders, getProvider, resolveProviderId, hasCredentials} from './provider-registry.js';

const DOMAIN_BUNDLES={
  biomedical:['pubmed_europepmc','openalex','semantic_scholar','doaj','core'],
  computer_science:['dblp','semantic_scholar','arxiv','openalex','publisher:acm','ieee_xplore'],
  physics:['arxiv','inspire_hep','openalex','nasa_ads'],
  engineering:['ieee_xplore','semantic_scholar','openalex','publisher:ieee'],
  general:['openalex','semantic_scholar','crossref','doaj','openaire'],
};
export function heuristicDomain(query){
  const q=String(query||'').toLowerCase();
  if(/\b(cancer|clinical|patient|histopathology|genom|pubmed|medicine|biomedical|disease|drug|protein|therapy|vaccine|hospital|cohort)\b/.test(q))return 'biomedical';
  if(/\b(physics|quantum|particle|astronom|cosmolog|galax|black hole)\b/.test(q))return 'physics';
  if(/\b(electrical|semiconductor|signal processing|power system|wireless|circuits)\b/.test(q))return 'engineering';
  if(/\b(algorithm|transformer|neural network|machine learning|compiler|computer science|recommender|graph learning|llm|deep learning)\b/.test(q))return 'computer_science';
  return 'general';
}
export async function classifyWithJev(query,{apiKey=process.env.TYPESAFE_API_KEY,client=null,minimumConfidence=0.7,eligible=[]}={}){
  if(!client&&!apiKey)return {ok:false,reason:'no_jev_credentials'};
  try {
    if(!client){
      const {TypeSafeClient}=await import('@typesafe-ai/sdk');
      client=new TypeSafeClient({apiKey});
    }
    const {choice,noul}=await import('@typesafe-ai/sdk');
    const allowed=eligible.filter(p=>p.capabilities.includes('paper_search'));
    if(!allowed.length)return {ok:false,reason:'no_eligible_providers'};
    const primaryOptions=Object.fromEntries(allowed.map(p=>[p.id,`${p.name}; disciplines ${p.domains.join(', ')}`]));
    const response=await client.systemOne({
      state:{query},
      questions:{
        domain:choice('Which research domain is the best fit?',{
          biomedical:null, computer_science:null, physics:null, engineering:null, general:null
        }),
        primary:choice('Choose the best FIRST academic search provider for this query from the available providers',primaryOptions),
        preprints:noul('Would preprints be useful for this query?'),
        clinical:noul('Does this query need clinical or biomedical evidence?')
      }
    });
    const chosen=response?.answers?.primary?.choice;
    const domain=response?.answers?.domain?.choice;
    const probability=Number(response?.answers?.primary?.probabilities?.[chosen]??0);
    if(!allowed.some(p=>p.id===chosen)||probability<minimumConfidence||!DOMAIN_BUNDLES[domain]){
      return {ok:false,reason:'low_confidence_or_invalid',confidence:probability};
    }
    return {ok:true,domain,primary:chosen,confidence:probability,preprints:Number(response.answers.preprints?.noul??0)>=0.5,clinical:Number(response.answers.clinical?.noul??0)>=0.5};
  }catch(err){return {ok:false,reason:'jev_error',message:err?.message||String(err)};}
}
export async function routeQuery({query,mode='jev',sources=null,maxProviders=5,credentials=process.env,canExecute=null,jevOptions={}}={}){
  if(!String(query||'').trim())throw new Error('query is required');
  if(!['jev','rules','manual','all'].includes(mode))throw new Error('unsupported routing mode');
  if(!Number.isInteger(maxProviders)||maxProviders<1||maxProviders>50)throw new Error('maxProviders must be an integer in 1..50');
  const eligible=listProviders({capability:'paper_search',includingPlanned:false})
    .filter(p=>hasCredentials(p,credentials)||p.id==='elsevier_scopus'||p.id==='springer_nature'||p.id==='ieee_xplore')
    .filter(p=>typeof canExecute==='function'?canExecute(p):true);
  // Native Springer/IEEE/Scopus may search via publisher Crossref fallback. The
  // adapter is accountable for disclosing the fallback in its response.
  let selected=[],jev=null,domain=heuristicDomain(query);
  if(mode==='manual'){
    if(!Array.isArray(sources)||!sources.length)throw new Error('manual mode requires non-empty sources');
    selected=[...new Set(sources.map(resolveProviderId))];
    for(const id of selected){
      const p=getProvider(id);
      if(!p)throw new Error(`unknown provider: ${id}`);
      if(!p.capabilities.includes('paper_search'))throw new Error(`${id} is not a paper-search provider`);
      if(p.bridge==='planned')throw new Error(`${id} is documented but has no paper-search adapter yet`);
      if(!eligible.some(x=>x.id===id))throw new Error(`${id} is not executable with current credentials/adapters`);
    }
  }else if(mode==='all'){
    selected=eligible.map(x=>x.id).slice(0,maxProviders);
  }else{
    if(mode==='jev')jev=await classifyWithJev(query,{...jevOptions,eligible});
    if(jev?.ok)domain=jev.domain;
    const bundle=DOMAIN_BUNDLES[domain]||DOMAIN_BUNDLES.general;
    selected=[...(jev?.ok?[jev.primary]:[]),...bundle];
    if(jev?.ok&&jev.preprints)selected.push('arxiv');
    if(jev?.ok&&jev.clinical)selected.push('pubmed_europepmc');
    // Stable order and hard eligibility gate. Do not add unimplemented providers.
    selected=[...new Set(selected)].filter(id=>eligible.some(p=>p.id===id)).slice(0,maxProviders);
    if(!selected.length)selected=eligible.slice(0,maxProviders).map(x=>x.id);
  }
  return {mode_requested:mode,engine:jev?.ok?'jev':'rules',domain,selected_providers:selected,
    fallback_reason:mode==='jev'&&!jev?.ok?jev?.reason||'jev_unavailable':null,
    jev_confidence:jev?.ok?jev.confidence:null};
}
