# QMSR V2 — Project Memory

## Project Overview

QMSR Inspection Readiness app — helps medical device quality leaders prepare for FDA inspections under the post-Feb-2-2026 QMSR framework (21 CFR Part 820 incorporating ISO 13485, inspected under CP 7382.850).

**Stack:** React + TypeScript + Vite, Supabase (auth + Postgres + Edge Functions), Anthropic Claude Sonnet 4.6 for narrative generation.

## Architecture

### Governing Regulatory Architecture
- **QMSR / current Part 820** as the binding layer
- **CP 7382.850** as the inspection lens
- **Topic-aware FDA guidance / recognized standards / MDSAP** as supplemental guardrails
- **openFDA** as external signal context only
- **LLM as a renderer**, not the decision-maker

### Key Design Principle
Compliance conclusions are determined by **deterministic client-side adjudication**, not by the LLM. The LLM renders prose constrained by locked findings.

## Completed Implementations

### 1. Deterministic Adjudication Layer (Sprint 1)
- **Guardrail registry** (`src/lib/guardrailRegistry.ts`) — 16-entry tiered citation registry (binding → inspection-program → guidance → standard → mdsap → public-signal)
- **Scenario facts extractor** (`src/lib/scenarioFacts.ts`) — Hybrid: explicit wizard-set facts override regex-based text extraction
- **Adjudication engine** (`src/lib/adjudication.ts`) — 8 test cases (TC1-TC8) with deterministic rule evaluation
- **V2 narrative payload** — `NarrativeStructuredPayloadV2` extends V1 with `adjudication` field; `buildNarrativeUserMessage()` conditionally appends `## LOCKED ADJUDICATION` section
- **Edge function** — `supabase/functions/narrative/index.ts` adjusts maxTokens (1280 for adjudication, 1024 otherwise)

### 2. First-Class ScenarioFacts (Sprint 2)
- `scenarioFacts` optional JSONB field on Scenario type and `scenarios` DB table
- Wizard Step 4 (Risk) has "Inspection context facts" card with toggle controls for all 8 TCs
- `extractScenarioFacts()` prefers explicit fields, falls back to regex for legacy scenarios
- DB migration: `009_scenario_facts.sql`

### 3. Adjudication Rules TC4-TC8 (Sprint 3)

### 6. Adjudication Rules TC9-TC13 (Sprint 6)

**Full rule set (TC1-TC13):**

| Rule | Pattern | Risk |
|------|---------|------|
| TC1 | Class III supplier change without evaluation | HIGH |
| TC2 | Complaints → user error → no trending | MEDIUM-HIGH |
| TC3 | Unvalidated spreadsheet + post-release calc error | HIGH |
| TC4 | Design change without V&V reassessment | HIGH (III) / MEDIUM-HIGH |
| TC5 | CAPA closed + same issue recurred | HIGH |
| TC6 | Special process without validation | MEDIUM-HIGH |
| TC7 | Management review not performed | MEDIUM |
| TC8 | swEnabled + software lifecycle not documented | MEDIUM-HIGH (III) / MEDIUM |
| TC9 | Labeling/UDI defect + no change control | MEDIUM-HIGH |
| TC10 | Sterile device + validation incomplete | HIGH (III) / MEDIUM-HIGH |
| TC11 | Training not maintained / competency not assessed | MEDIUM-HIGH |
| TC12 | Risk management file incomplete | MEDIUM-HIGH (III) / MEDIUM |
| TC13 | Incoming failures not escalated / calibration lapsed / nonconforming not controlled | MEDIUM-HIGH / MEDIUM |

### 4. Structured Narrative UI (Sprint 4)
- `AdjudicationCard.tsx` — Presentational component for deterministic findings
- Renders above LLM prose when adjudication is triggered
- Color-coded risk badges (HIGH=warn, MEDIUM-HIGH=warn/60, MEDIUM=partial, LOW=good)
- Expandable evidence/authorities/actions per finding via native `<details>/<summary>`
- Authorities rendered as external links
- Regulatory basis footer (binding + inspection lens citations)
- NarrativeView labels LLM section as "AI Commentary" when adjudication active

### 5. Post-Generation Narrative Validation (Sprint 5)
- `narrativeValidator.ts` — validates LLM output against locked adjudication
- Checks: authority citation presence, prohibited softening phrases, risk level mention
- `ValidationWarnings.tsx` — amber alert card showing validation issues
- NarrativeView computes validation after generate, displays warnings between adjudication card and prose

## Test Coverage
- **413 tests** across 19 files, all passing
- **23 fixture scenarios** (13 general + 3 TC1-TC3 + 5 TC4-TC8 + 5 TC9-TC13) + 4 FDA data factories
- Regression: all general fixtures return `triggered: false` for adjudication rules

## Key File Map

### Types
- `src/types/scenario.ts` — Scenario interface, DEFAULT_SCENARIO
- `src/types/analysis.ts` — ScenarioFacts (35 fields), AdjudicationResult, GuardrailCitation, NarrativeStructuredPayloadV2

### Core Logic
- `src/lib/analysis.ts` — buildFocus, buildRiskThread, buildOAIFactors, getOverallReadiness, triangulate, buildNarrativeStructuredPayloadV2, buildNarrativeUserMessage, NARRATIVE_SYSTEM_PROMPT
- `src/lib/adjudication.ts` — buildAdjudication (TC1-TC13), buildTechnologyGuidance
- `src/lib/scenarioFacts.ts` — extractScenarioFacts (explicit + regex fallback)
- `src/lib/narrativeValidator.ts` — validateNarrative (post-generation checks)
- `src/lib/guardrailRegistry.ts` — GUARDRAILS record, citation helpers
- `src/lib/signalRegistry.ts` — 17 canonical SignalKeys

### Persistence
- `src/lib/scenarioMapper.ts` — scenarioToDb, dbToScenario, mergeScenarioPatch
- `src/hooks/useScenario.ts` — load + debounced save
- `src/hooks/useNarrative.ts` — NarrativeGenerateInput { systemPrompt, userContent }

### UI
- `src/components/wizard/Step4Risk.tsx` — Risk text + technology toggles + inspection context fact toggles (TC1-TC13)
- `src/components/narrative/NarrativeView.tsx` — Computes adjudication, renders AdjudicationCard + LLM prose
- `src/components/narrative/AdjudicationCard.tsx` — Structured deterministic findings display
- `src/components/narrative/ValidationWarnings.tsx` — Post-generation validation warning display
- `src/pages/ScenarioDetail.tsx` — Detail page with outlet context

### Edge Function
- `supabase/functions/narrative/index.ts` — Accepts { systemPrompt, userContent }, calls Claude Sonnet 4.6, returns { text }

### Tests
- `src/lib/adjudication.test.ts` — TC1-TC8 rule tests + regression
- `src/lib/scenarioFacts.test.ts` — Fact extraction (regex + explicit override)
- `src/lib/adjudicationNarrative.test.ts` — V2 payload integration
- `src/lib/guardrailRegistry.test.ts` — Citation registry
- `src/lib/analysis.test.ts`, `narrativePrompt.test.ts`, `noHallucination.test.ts`, `integration.test.ts` — Core analysis functions

### Fixtures
- `src/lib/__fixtures__/scenarios.ts` — 18 scenario factories + 4 FDA data factories

## Conventions
- Tests: Vitest, run with `npm test` (from qmsr-app directory)
- Build: `npm run build` (tsc + vite)
- Path aliases: `@/` → `src/`
- QMS areas: mgmt, dd, prod, change, out, meas
- Adjudication rules follow pattern: check facts → push AdjudicationFinding → deduplicate → compute overall risk
- V1 narrative path (`buildNarrativePrompt`) preserved for test backward compatibility
- Edge function contract: `{ systemPrompt, userContent } → { text }` (unchanged)

## Potential Future Work
- Additional adjudication rules beyond TC13 (internal audit, document control, design input/output/review)
- Signal-to-adjudication wiring (use existing SignalKeys to influence rule firing)
- Narrative quality scoring (quantify how well the LLM followed adjudication constraints)
