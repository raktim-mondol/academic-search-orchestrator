import test from 'node:test';import assert from 'node:assert/strict';
import {createAcademicSearchBridge,toPythonProvider} from '../src/index.js';
test('bridge maps every publisher to Python adapter and checks provider execution',async()=>{
 assert.equal(toPythonProvider('publisher:acm'),'acm');
 const bridge=createAcademicSearchBridge({fetchImpl:async(_u,opts)=>{
  const body=JSON.parse(opts.body);assert.deepEqual(body.providers,['acm']);
  return {ok:true,json:async()=>({providers_queried:['acm'],results:[{title:'Paper',doi:'10.1234/a'}]})};
 }});
 const r=await bridge({provider:'publisher:acm',query:'search'});assert.equal(r.results.length,1);
});
test('unsupported provider cannot be treated as a successful empty result',async()=>{
 const bridge=createAcademicSearchBridge({fetchImpl:async()=>({ok:true,json:async()=>({providers_queried:[],results:[]})})});
 await assert.rejects(bridge({provider:'openaire',query:'search'}));
});
