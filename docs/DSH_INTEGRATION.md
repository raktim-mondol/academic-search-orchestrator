# Integrate without introducing a second DSH tool

Target: [`raktim-mondol/academic-harness`](https://github.com/raktim-mondol/academic-harness).

## 1. Install the package

Install `academic-search-orchestrator` locally or from npm, then import it from the existing `literature-search.js`. **Do not** add it to the host-level `index.js` `apply()` — in Academic Harness that entry registers globally accessible tools, whereas `literature_search` is a preset-scoped tool registration. Keep the existing `cordis.patch.yml`/`presets/academic-harness/agent.cordis.yml` mounts.

## 2. Preserve manual source selection

Add optional `routing` (`jev` / `rules` / `manual` / `all`) to the existing tool schema. Map `sources='auto'` to `routing='jev'`, preserving existing `sources=[...]` semantics as `manual`. Maintain the existing `chooseSources` sync export as a compatibility fallback: `deep_research.js` and `literature_watch.js` currently rely on it.

## 3. Bring in the JS orchestrator

Illustrative excerpt for `literature-search.js` (not an auto-applied patch):

```js
import {searchResearch,createDshAdapter,canDshRun} from 'academic-search-orchestrator';
import {runSource} from './literature-search.js'; // In the real file, refer to its local declaration, do not self-import.

// Inside existing DSH tool execute(args, exec):
const searched=await searchResearch({
 query:args.query,
 mode:args.routing||'jev',
 sources:Array.isArray(args.sources)?args.sources:null,
 credentials:process.env,
 searchProvider:createDshAdapter(runSource),
 canExecute:canDshRun,
 maxProviders:5,
 limit:Math.min(args.max_results||20,100),
 signal:exec.signal
});
// Map searched.papers and searched.routing to the existing DSH JSON output.
```

For DBLP or other Python-only providers, create a dispatch adapter that uses `createAcademicSearchBridge()` when DSH's `runSource` has no matching native implementation. `canExecute` must reflect actual configuration, not catalogue membership. When DSH credentials are configured via Settings rather than `process.env`, use the host's existing `resolveEnv()` to build credential availability from the configured fields. Add `TYPESAFE_API_KEY` to `settings-keys.js` so `resolveEnv()` can read it. **Do not pass API keys to the user-facing result JSON**.

## 4. DSH deep research and other consumers

- `deep-research.js`: replace the direct `chooseSources()/runSource()/mergeRanked()` code in `buildSearch()` with the shared orchestration invocation. Retain its append-only evidence ledger and ship gate.
- `literature-watch.js`: route queries through the same engine so stored source identities are stable; changing canonical ID rules requires versioned migration.
- `paper-get.js`, `paper-resolve.js`: enrich canonical records; do not conflate a published article with a preprint.
- `citation-audit.js`: only mark bibliography verified after the network metadata check, and never turn that verdict into claim-support verified.
- `paper_context.js`/`paper_context` and `deep-research` evidence passages: add actual full-text verification and page/section locators before claiming support.

## 5. Release gates

1. Import existing `scripts/test-search-normalize.mjs`, `scripts/test-deep-research.mjs`, `scripts/test-academic-search-parity.mjs` regression fixtures.
2. Test correct fallback when Jev is unavailable/low confidence and when an API key is missing.
3. Measure held-out provider selection accuracy, cost, latency, recall@K, dedupe precision and citation error rate.
4. Verify that a Crossref member result only adds one independent RRF source-family vote.
5. Test concurrent calls and rate limiting against real provider quotas, only with configured credentials.
6. Re-run DSH preset-scoping and Linux runtime tests; preserve existing client contracts.

## 6. Architecture boundary

This is a **library** and should stay library-first inside DSH. If you later expose a multi-tenant public API for 100–1,000 accounts, wrap the library in a service with authentication, Redis quotas/cache, PostgreSQL canonical identity + raw observations, audit trail, and per-user billing. Do not assume this local orchestrator already provides those capabilities.
