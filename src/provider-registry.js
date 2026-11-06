/**
 * Source of truth for the 26 catalog entries in academic-search and their
 * publisher-member routes. A listed source is not automatically executable.
 * `bridge` describes the currently available API surface:
 *   - acadsearch: implemented in academic-search's AcademicSearchClient.search_papers
 *   - dsh:       available through an existing Academic Harness tool
 *   - planned:   documented capability requiring an adapter
 * Non-paper resources remain visible for other workflows but cannot be fed
 * into the paper-search RRF lane until they have compatible result adapters.
 */
const entry = (id, name, capabilities, opts = {}) => Object.freeze({
  id, name, capabilities: Object.freeze(capabilities),
  domains: Object.freeze(opts.domains || ['general']),
  bridge: opts.bridge || 'planned',
  key: opts.key || null,
  family: opts.family || id,
  enabled: opts.enabled !== false,
  sourceCatalog: opts.sourceCatalog || 'academic-search',
  note: opts.note || null,
});

// 26 IDs from acadsearch/providers/keyed_enterprise.py SUPPORTED_DATABASES_CATALOG.
export const ACADEMIC_SEARCH_CATALOG = Object.freeze([
  entry('openalex','OpenAlex',['paper_search','paper_lookup','journal_search','citations'],{bridge:'acadsearch',domains:['general','biomedical','computer_science','physics']}),
  entry('semantic_scholar','Semantic Scholar',['paper_search','paper_lookup','citations','snippets'],{bridge:'acadsearch',domains:['general','computer_science','biomedical']}),
  entry('crossref','Crossref',['paper_search','doi_lookup','journal_search','bibtex'],{bridge:'acadsearch',family:'crossref'}),
  entry('elsevier_scopus','Elsevier Scopus / ScienceDirect',['paper_search','journal_metrics','full_text'],{bridge:'acadsearch',key:'SCOPUS_API_KEY',domains:['general','biomedical','computer_science'],family:'scopus'}),
  entry('clarivate_wos','Web of Science',['paper_search','citation_metrics','journal_metrics'],{bridge:'acadsearch',key:'WOS_API_KEY',family:'wos'}),
  entry('wiley','Wiley',['paper_search','full_text'],{bridge:'acadsearch',family:'crossref',domains:['general','biomedical']}),
  entry('springer_nature','Springer Nature',['paper_search','full_text'],{bridge:'acadsearch',key:'SPRINGER_API_KEY',family:'springer',domains:['general','biomedical','computer_science']}),
  entry('ieee_xplore','IEEE Xplore',['paper_search','full_text'],{bridge:'acadsearch',key:'IEEE_API_KEY',family:'ieee',domains:['computer_science','engineering']}),
  entry('arxiv','arXiv',['paper_search','paper_lookup','full_text','bibtex'],{bridge:'acadsearch',domains:['computer_science','physics','mathematics','general']}),
  entry('pubmed_europepmc','PubMed / Europe PMC',['paper_search','paper_lookup','full_text'],{bridge:'acadsearch',domains:['biomedical']}),
  entry('pubtator3','PubTator 3.0',['entity_search','full_text'],{bridge:'planned',domains:['biomedical']}),
  entry('doaj','DOAJ',['paper_search','journal_search','open_access'],{bridge:'acadsearch'}),
  entry('dblp','DBLP',['paper_search','venue_search','bibtex'],{bridge:'acadsearch',domains:['computer_science']}),
  entry('inspire_hep','INSPIRE-HEP',['paper_search','citations','bibtex'],{bridge:'acadsearch',domains:['physics']}),
  entry('unpaywall','Unpaywall',['oa_lookup','full_text'],{bridge:'planned'}),
  entry('opencitations','OpenCitations',['citation_graph','doi_lookup'],{bridge:'planned'}),
  entry('taylor_francis_sage_oup_cup_acm_acs_aps','Major publisher group',['paper_search'],{bridge:'planned',family:'crossref',note:'Expanded into individual publisher:* options below'}),
  entry('datacite','DataCite',['dataset_search','doi_lookup','preprint_search'],{bridge:'planned'}),
  entry('openaire','OpenAIRE',['paper_search','dataset_search','funding_search'],{bridge:'planned'}),
  entry('biorxiv_medrxiv','bioRxiv / medRxiv',['preprint_lookup','version_linking'],{bridge:'planned',domains:['biomedical']}),
  entry('hal_zenodo','HAL / Zenodo',['paper_search','repository_search','dataset_search'],{bridge:'planned'}),
  entry('core','CORE',['paper_search','full_text'],{bridge:'acadsearch',key:'CORE_API_KEY'}),
  entry('nasa_ads','NASA ADS',['paper_search','citations'],{bridge:'dsh',key:'ADS_API_TOKEN',domains:['physics']}),
  entry('consensus','Consensus',['paper_search','study_filter'],{bridge:'dsh',key:'CONSENSUS_API_KEY',domains:['biomedical','general']}),
  entry('scite','scite',['citation_context','retraction_checks'],{bridge:'dsh',key:'SCITE_API_KEY'}),
  entry('elicit','Elicit',['paper_search','structured_extraction'],{bridge:'dsh',key:'ELICIT_API_KEY'})
]);

// Distinct Crossref members from PUBLISHER_CROSSREF_MEMBERS (canonical aliases).
const MEMBERS = Object.freeze({
  wiley:311,elsevier:78,springer:297,ieee:263,taylor_francis:301,sage:179,
  oup:286,cup:56,acm:320,acs:316,aps:16,iop:266,rsc:292,mdpi:1968,
  frontiers:1965,plos:340
});
export const PUBLISHER_MEMBERS = MEMBERS;
export const PUBLISHER_ROUTES = Object.freeze(Object.entries(MEMBERS).map(([name,member])=>
  entry(`publisher:${name}`,`${name.replace(/_/g,' ')} (Crossref member ${member})`,['paper_search'],{
    bridge:'acadsearch',family:'crossref',note:`Crossref member ${member}`,
    domains:name==='acm'||name==='ieee'?['computer_science','engineering']:['general']
  })
));

// Distinct integrations discussed in the larger API reference but not
// implemented by acadsearch.search_papers. Retain them as visible planned routes.
export const DOCUMENTED_EXTRAS = Object.freeze([
  entry('orcid','ORCID',['author_lookup','author_works'],{sourceCatalog:'reference-manual'}),
  entry('dimensions','Dimensions',['paper_search','funding_search','patent_search'],{sourceCatalog:'reference-manual'}),
  entry('lens','The Lens',['paper_search','patent_search'],{sourceCatalog:'reference-manual'}),
  entry('google_scholar','Google Scholar via SerpApi/Serper',['paper_search'],{sourceCatalog:'reference-manual'}),
  entry('futurehouse','FutureHouse / PaperQA2',['research_agent'],{sourceCatalog:'reference-manual'})
]);

export const REGISTRY = Object.freeze([
  ...ACADEMIC_SEARCH_CATALOG,
  ...PUBLISHER_ROUTES,
  ...DOCUMENTED_EXTRAS
]);
export const byId = new Map(REGISTRY.map(record=>[record.id,record]));
const ALIASES = new Map(Object.entries({
  's2':'semantic_scholar','pubmed':'pubmed_europepmc','europepmc':'pubmed_europepmc',
  'inspire':'inspire_hep','ads':'nasa_ads','scopus':'elsevier_scopus',
  'wos':'clarivate_wos','springer':'springer_nature','ieee':'ieee_xplore',
  'biorxiv':'biorxiv_medrxiv','medrxiv':'biorxiv_medrxiv',
  'publisher:oxford':'publisher:oup','publisher:cambridge':'publisher:cup',
  'publisher:nature':'publisher:springer'
}));
export function resolveProviderId(id) {
  const normalized=String(id||'').toLowerCase().trim();
  return ALIASES.get(normalized)||normalized;
}
export function getProvider(id){return byId.get(resolveProviderId(id))||null;}
export function listProviders({capability=null,includingPlanned=true}={}){
  return REGISTRY.filter(p=>(!capability||p.capabilities.includes(capability))&&(includingPlanned||p.bridge!=='planned'));
}
export function hasCredentials(provider,credentials=process.env){
  // Keyed publisher-native providers can degrade to Crossref member search;
  // operational status must be checked by the execution adapter.
  return !provider.key||Boolean(credentials?.[provider.key]);
}
