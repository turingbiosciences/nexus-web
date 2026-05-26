## 2026-02-06 - Prevented Unconditional Fetch in Debug Component

**Learning:** The `DebugPanel` component was fetching user data in a `useEffect` hook unconditionally, even when the panel was hidden (debug mode off). This resulted in wasted API calls for all production users.
**Action:** Always check feature flags or visibility conditions _before_ executing side effects (like data fetching) in `useEffect`. Add these conditions as dependencies or guard clauses.

## 2026-02-06 - Memoized Expensive Sort in Datasets List

**Learning:** The `DatasetsSection` component was performing O(N log N) sorting and filtering on every render cycle. Since the component consumes the `ProjectsProvider`, any project update caused a re-render and re-sort, even if the dataset list was unchanged.
**Action:** Move expensive array transformations (filter, sort, map) inside `useMemo` to ensure they only run when the underlying data actually changes, decoupling render performance from unrelated context updates.

## 2026-02-06 - Minimatch Security Vulnerability vs ESLint v9

**Learning:** `minimatch` versions < 10.2.1 have a high-severity ReDoS vulnerability. However, upgrading to `minimatch` v10+ (which is ESM-only) breaks `eslint` v9 and `eslint-config-next` in this project because they or their dependencies rely on CommonJS `require('minimatch')` or default exports which v10 removed.
**Action:** Cannot safely upgrade `minimatch` via `overrides` without breaking linting. Future updates to `eslint-config-next` or `eslint` ecosystem are required to support ESM `minimatch` properly.

## 2026-02-06 - Memoized Expensive Data Transformation in FeatureComparisonChart

**Learning:** The `FeatureComparisonChart` component was iterating, sorting, and transforming a potentially large nested `data` object on every single render. This O(N log N) recalculation of nested map structures could cause frame drops and unnecessary main thread blocking during unrelated component or parent re-renders.
**Action:** Always wrap expensive synchronous data parsing, nested iteration, and object/array transformations inside components with a `useMemo` hook, especially when processing data for large or complex Recharts visualizations, so they only execute when the prop references actually change.

## 2026-02-06 - Memoized Expensive Data Transformation in FeatureImportanceChart

**Learning:** The `FeatureImportanceChart` and `NormalizedFeatureImportanceChart` components were calling `parseFeatureImportance` synchronously during the render loop. Since parsing involves array sorting, mapping, and filtering (O(N log N)), performing this unmemoized transformation caused redundant processing overhead on every render when the charts or their parents updated, even if the underlying `featureImportance` data had not changed.
**Action:** Always wrap expensive data parsing and transformation routines (e.g., `parseFeatureImportance`, sorting arrays for charts) in `useMemo` so that they execute only when the referenced props actually change, keeping the render loop lightweight and performant.

## 2026-02-06 - Schwartzian Transform for Stable Sorting Optimization

**Learning:** When using the Schwartzian Transform to optimize sorting (like in `parseFeatureImportance`), JavaScript's `Array.prototype.sort()` is stable. However, to preserve a specific fallback order (like original rank) when primary values (like importance) are tied, you must explicitly include the fallback in the comparator (`return a.importance !== b.importance ? b.importance - a.importance : a._rank - b._rank`). Replacing multiple `.filter()`, `.map()`, and `.sort()` chains with a single loop and a final sort significantly reduces overhead, achieving an O(N) extraction followed by a single O(N log N) sort instead of redundant O(N log N) passes.
**Action:** When extracting and parsing complex objects, consolidate map/filter chains into a single `for...in` or standard `for` loop to build the array, extracting any necessary sort keys (like rank from a string) once. Then perform exactly one final sort that includes all primary and tie-breaking conditions.
