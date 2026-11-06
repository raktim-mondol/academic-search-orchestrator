import {searchResearch} from '../src/index.js';
const fixtures={
 openalex:[{title:'Graph Networks for Breast Cancer Prognosis',doi:'10.1234/example',year:2025,authors:[{name:'Jane Smith'}],citation_count:12},
           {title:'Weakly Supervised Histopathology',doi:'10.1000/unique',year:2024,authors:[{name:'Tom Doe'}]}],
 pubmed_europepmc:[{title:'Graph Networks for Breast Cancer Prognosis',doi:'https://doi.org/10.1234/example',year:2025,authors:[{name:'Jane Smith'}],pmid:'123456'}],
 semantic_scholar:[{title:'Graph Networks for Breast Cancer Prognosis',doi:'10.1234/example',year:2025,authors:[{name:'Jane Smith'}]}]
};
const results=await searchResearch({query:'breast cancer prognosis',mode:'manual',
 sources:['openalex','pubmed_europepmc','semantic_scholar'],
 canExecute:()=>true,searchProvider:async({provider})=>({results:fixtures[provider]||[]})});
console.log(JSON.stringify({routing:results.routing,total_records:results.total_records,
 total_unique:results.total_unique,duplicates_collapsed:results.duplicates_collapsed,
 papers:results.papers.map(p=>({title:p.title,doi:p.doi,rrf_score:p.rrf_score,observations:p.provenance.length}))},null,2));
