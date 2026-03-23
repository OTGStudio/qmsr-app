# React + TypeScript + Vite

## QMSR inspection engine (developer notes)

- **Canonical signals:** `src/lib/signalRegistry.ts` is the single source of truth. Scenario `signals` stores `SignalKey` values; UI shows `signalLabel(key)`. Free-text that does not normalize stays in `unsupportedSignals` (reviewer context only; not used for deterministic analysis).
- **Deterministic vs contextual:** Analysis, OAI, readiness, and narrative payloads use normalized canonical signals and structured scenario data. Unsupported notes are passed to the narrative only as labeled context, not as facts.
- **Step 6:** Self-ratings are an optional overlay; they modulate emphasis but do not replace signals, risk text, or FDA triangulation.
- **FEI:** `validateFEI()` enforces **format only** (empty allowed, or exactly 10 digits). **Establishment verification** is a separate evidence object on the scenario (`feiVerification` / DB `fei_verification` JSON): syntax validity is not treated as “FDA verified.” Launch does **not** block when lookup is unavailable or not run; after a **user-initiated** lookup, `not_found` / `verification_failed` can block. Providers live under `src/lib/feiProviders/`; openFDA is enrichment-only until an authoritative FEI source is wired. Set `VITE_FEI_MOCK=true` for deterministic mock verification in dev.

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
