import { mockProjects, getProjectById } from '@/lib/mock-data';

describe('mock-data', () => {
  it('exposes a non-empty projects array', () => {
    expect(Array.isArray(mockProjects)).toBe(true);
    expect(mockProjects.length).toBeGreaterThan(0);
  });

  it('retrieves a project by id', () => {
    const first = mockProjects[0];
    expect(getProjectById(first.id)).toEqual(first);
  });
});
