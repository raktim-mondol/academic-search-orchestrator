import test from 'node:test';import assert from 'node:assert/strict';
import {ACADEMIC_SEARCH_CATALOG,PUBLISHER_ROUTES,REGISTRY,getProvider,listProviders,resolveProviderId} from '../src/index.js';
test('every academic-search catalogue ID retained and publisher routes individual',()=>{
 assert.equal(ACADEMIC_SEARCH_CATALOG.length,26);
 assert.equal(PUBLISHER_ROUTES.length,16);
 assert.ok(REGISTRY.length>=47);
 assert.equal(new Set(REGISTRY.map(x=>x.id)).size,REGISTRY.length);
 assert.equal(getProvider('publisher:acm').family,'crossref');
 assert.equal(resolveProviderId('s2'),'semantic_scholar');
 assert.equal(listProviders({capability:'paper_search'}).some(x=>x.id==='dblp'),true);
 assert.equal(getProvider('unpaywall').capabilities.includes('paper_search'),false);
});
