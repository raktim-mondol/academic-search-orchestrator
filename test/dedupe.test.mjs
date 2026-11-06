import test from 'node:test';import assert from 'node:assert/strict';
import {dedupeAndRank} from '../src/index.js';
const a=(doi,source)=>({title:'Same publication',doi,year:2025,authors:[{name:'Jane Smith'}],source});
test('identical DOI merges across providers, stores provenance',()=>{
 const r=dedupeAndRank([{source:'openalex',results:[a('10.1234/a','openalex')]},{source:'semantic_scholar',results:[a('https://doi.org/10.1234/a','s2')]}]);
 assert.equal(r.total_records,2);assert.equal(r.total_unique,1);assert.equal(r.duplicates_collapsed,1);
 assert.equal(r.papers[0].provenance.length,2);
});
test('different DOIs must not merge solely on same title/year',()=>{
 const r=dedupeAndRank([{source:'openalex',results:[a('10.1234/a')]},{source:'crossref',results:[a('10.1234/b')]}]);
 assert.equal(r.total_unique,2);
});
test('title/year alone without author is not sufficient',()=>{
 const r=dedupeAndRank([{source:'openalex',results:[{title:'Shared Name',year:2023}]},{source:'dblp',results:[{title:'Shared Name',year:2023}]}]);
 assert.equal(r.total_unique,2);
});
test('publisher member appearances do not boost rank as independent indexes',()=>{
 const r=dedupeAndRank([{source:'publisher:acm',results:[a('10.1234/a')]},{source:'publisher:ieee',results:[a('10.1234/a')]}]);
 assert.equal(r.total_unique,1);
 assert.equal(r.papers[0].rrf_score,1/61);
 assert.equal(r.papers[0].provenance.length,2);
});
test('explicit preprint relation links rather than merges different DOIs',()=>{
 const r=dedupeAndRank([{source:'arxiv',results:[{title:'Research',doi:'10.1234/pre',published_doi:'10.1234/journal',year:2023}]},{source:'crossref',results:[{title:'Research',doi:'10.1234/journal',year:2024}]}]);
 assert.equal(r.total_unique,2);
 assert.equal(r.papers.find(p=>p.doi==='10.1234/pre').version_relations[0].type,'is_preprint_of');
});
