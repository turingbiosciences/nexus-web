import {
  mockProjects,
  getProjectStatusCount,
  getProjectById,
} from "@/lib/mock-data";

describe("mock-data", () => {
  it("exposes a non-empty projects array", () => {
    expect(Array.isArray(mockProjects)).toBe(true);
    expect(mockProjects.length).toBeGreaterThan(0);
  });

  it("computes status counts matching dataset", () => {
    const counts = getProjectStatusCount(mockProjects);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(mockProjects.length);
  });

  it("retrieves a project by id", () => {
    const first = mockProjects[0];
    expect(getProjectById(first.id)).toEqual(first);
  });
});
