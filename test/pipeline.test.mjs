import test from 'node:test';import assert from 'node:assert/strict';
import {searchResearch,validateClaimCitations} from '../src/index.js';
test('search returns partial failures, audited bibliographic states',async()=>{
 const r=await searchResearch({query:'Graph learning',mode:'manual',sources:['openalex','dblp'],
  searchProvider:async({provider})=>provider==='dblp'?Promise.reject(new Error('timeout')):{results:[{title:'Graph learning in 2023',doi:'10.1234/x',year:2023}]}});
 assert.equal(r.total_unique,1);assert.equal(r.failures.length,1);
 assert.equal(r.bibliography[0].claim_support_status,'not_checked');
 assert.equal(validateClaimCitations([{citation_ids:[r.papers[0].canonical_id]}],r.papers)[0].citation_status,'identifiers_resolved');
});
