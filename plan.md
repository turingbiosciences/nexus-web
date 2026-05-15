1. **Optimize `fetchMock` in `src/lib/queries/activities.ts`**: Replace `projectsRepository.list()` followed by `.find()` with `projectsRepository.get(projectId)`. This prevents fetching the entire list of mock projects just to find one.
2. **Optimize `fetchMock` in `src/lib/queries/results.ts`**: Replace `projectsRepository.list()` followed by `.find()` with `projectsRepository.get(projectId)`. This is the same optimization as above.
3. **Verify changes**: Ensure the tests pass and the mock functionality works as expected.
4. **Pre-commit**: Run lint and format checks.
