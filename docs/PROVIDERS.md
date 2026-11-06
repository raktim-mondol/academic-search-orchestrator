# Provider coverage matrix

Source of truth: [`academic-search`](https://github.com/raktim-mondol/academic-search) `acadsearch/providers/keyed_enterprise.py` 26-entry `SUPPORTED_DATABASES_CATALOG`, Python `AcademicSearchClient.asearch_papers`, and DSH Academic Harness `literature-search.js`/other tools. This file distinguishes **catalogued** from **executable** providers.

## Paper-search callable through `acadsearch.asearch_papers`

- `openalex`, `semantic_scholar`, `crossref`, `arxiv`, `pubmed_europepmc`, `dblp`, `doaj`, `inspire_hep`, `core`
- `elsevier_scopus` (native Scopus with API key / Crossref publisher fallback), `clarivate_wos` (keyed), `springer_nature` (native/ publisher fallback), `ieee_xplore` (native/ publisher fallback), `wiley` (publisher Crossref member).
- `publisher:wiley`, `publisher:elsevier`, `publisher:springer`, `publisher:ieee`, `publisher:taylor_francis`, `publisher:sage`, `publisher:oup`, `publisher:cup`, `publisher:acm`, `publisher:acs`, `publisher:aps`, `publisher:iop`, `publisher:rsc`, `publisher:mdpi`, `publisher:frontiers`, `publisher:plos`.

Namespaced `publisher:*` routes are **Crossref member-filtered**. They are not native publisher APIs. Do not count them as independent provider families for RRF. Different aliases of a single member refer to the same provider.

## Catalogued, but not generic Python `asearch_papers` routes

- `pubtator3`: biomedical entity/relation retrieval and annotated text.
- `unpaywall`: known-DOI OA link resolution.
- `opencitations`: citation graph by identifiers.
- `datacite`: research objects, datasets and preprint metadata; dedicated search adapter pending.
- `openaire`: graph and projects; dedicated generic search adapter pending.
- `biorxiv_medrxiv`: version lookup; keyword-discovery via Europe PMC or DSH's preprint path.
- `hal_zenodo`: repository APIs; dedicated bridge pending.
- `nasa_ads`: DSH native `runSource('ads')`, not Python's generic `asearch_papers`.
- `consensus`: DSH native separate `consensus_search` tool; needs explicit adapter to join unified results.
- `scite`: citation-context/retraction service, not ordinary paper-search in this scaffold.
- `elicit`: DSH native separate `elicit_search` tool; needs explicit adapter.
- `taylor_francis_sage_oup_cup_acm_acs_aps`: grouped catalogue display entry; select individual `publisher:*` routes instead.

## Documented in the reference manual; additional adapters required

- ORCID author bibliography, Dimensions, The Lens, Google Scholar via SerpApi/Serper, FutureHouse PaperQA2.

The database catalogue is not the same as the list of working native keyword-search adapters. `listProviders()` exposes all, but the orchestrator selects only an executable paper-search adapter. To add a specialized source, implement an adapter with normalized paper results and opt into the appropriate capability lane.

## Credential policy

- No key required for OpenAlex, Crossref, arXiv, PubMed/Europe PMC, DBLP, DOAJ, INSPIRE, or publisher Crossref filtering (subject to network limits).
- Native Scopus, WoS, IEEE, Springer APIs require their corresponding keys and sometimes institutional entitlements; some support Crossref fallback.
- CORE, ADS, Consensus, Elicit, scite need keys for their respective commercial/specialized tiers.
- Check provider terms and configured access in production. Do not interpret a catalogue's `live_without_key` as verified real-time entitlement.
