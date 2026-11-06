# Architecture diagrams

The diagrams in this directory are authored as editable Mermaid-language **`.mmd`** files and rendered by **[Pele](https://github.com/jpmanson/pele-skill)**, instead of relying on GitHub's Mermaid-fence preview.

Pele is an SVG renderer for Mermaid syntax, not a separate diagram-description language. We deliberately use multiple types to communicate different dimensions of the system:

| Figure | Diagram type | Purpose |
|---|---|---|
| [System architecture](system-architecture.mmd) | `architecture-beta` | Logical subsystems, adapters, planned stages |
| [Query lifecycle](query-lifecycle.mmd) | `swimlane-beta` | Ownership of request processing, routing fallback, dedupe and citation preparation |
| [Adapter sequence](adapter-sequence.mmd) | `sequenceDiagram` | Native JS and Python REST call boundary |
| [Proposed data model](proposed-data-model.mmd) | `erDiagram` | Future durable observation and evidence persistence |

## Generating SVGs

The GitHub Actions workflow `.github/workflows/pele-diagrams.yml` checks out a **pinned upstream pele-skill commit**, installs `pele@1.6.0` in the skill's own directory, invokes its `scripts/render.mjs` with `--static-colors`, uploads the output SVGs and commits them to the feature branch on pushes.

For local rendering after installing the [Pele skill](https://github.com/jpmanson/pele-skill):

```bash
for diagram in docs/diagrams/*.mmd; do
  node /path/to/pele-skill/skills/pele/scripts/render.mjs --static-colors "$diagram" "${diagram%.mmd}.svg"
done
```

A passing render receipt (`ok: true`) and valid SVG output are mandatory. The pipeline fails on a syntax error rather than silently falling back to another renderer.

**Implementation scope:** The system architecture labels DSH LLM synthesis and full-text claim verification as integration work; the ER figure is a **proposed future persistence schema**, not a description of a database currently deployed.
