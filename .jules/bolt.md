## 2026-02-06 - Prevented Unconditional Fetch in Debug Component
**Learning:** The `DebugPanel` component was fetching user data in a `useEffect` hook unconditionally, even when the panel was hidden (debug mode off). This resulted in wasted API calls for all production users.
**Action:** Always check feature flags or visibility conditions *before* executing side effects (like data fetching) in `useEffect`. Add these conditions as dependencies or guard clauses.
