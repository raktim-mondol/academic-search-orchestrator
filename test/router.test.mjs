import test from 'node:test';import assert from 'node:assert/strict';
import {routeQuery} from '../src/index.js';
test('rule fallback keeps biomedical providers',async()=>{
 const r=await routeQuery({query:'breast cancer',mode:'jev',jevOptions:{apiKey:null},canExecute:p=>['openalex','pubmed_europepmc','semantic_scholar'].includes(p.id)});
 assert.equal(r.engine,'rules');assert.ok(r.selected_providers.includes('pubmed_europepmc'));
});
test('manual rejects enrichment-only, unknown and unimplemented',async()=>{
 for(const source of ['unpaywall','missing','google_scholar']){
  await assert.rejects(routeQuery({query:'test',mode:'manual',sources:[source]}));
 }
});
test('manual keeps unique provider IDs',async()=>{
 const r=await routeQuery({query:'test',mode:'manual',sources:['s2','semantic_scholar','dblp']});
 assert.deepEqual(r.selected_providers,['semantic_scholar','dblp']);
});
