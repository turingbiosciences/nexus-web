## 2026-02-06 - Prevented Unconditional Fetch in Debug Component

**Learning:** The `DebugPanel` component was fetching user data in a `useEffect` hook unconditionally, even when the panel was hidden (debug mode off). This resulted in wasted API calls for all production users.
**Action:** Always check feature flags or visibility conditions _before_ executing side effects (like data fetching) in `useEffect`. Add these conditions as dependencies or guard clauses.

## 2026-02-06 - Memoized Expensive Sort in Datasets List

**Learning:** The `DatasetsSection` component was performing O(N log N) sorting and filtering on every render cycle. Since the component consumes the `ProjectsProvider`, any project update caused a re-render and re-sort, even if the dataset list was unchanged.
**Action:** Move expensive array transformations (filter, sort, map) inside `useMemo` to ensure they only run when the underlying data actually changes, decoupling render performance from unrelated context updates.
