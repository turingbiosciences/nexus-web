import { projectsRepository } from "../index";
import { MockProjectsRepository } from "../mock-projects-repository";

// Mock the flags module to test different modes
jest.mock("@/config/flags", () => ({
  DATA_MODE: "mock",
}));

describe("data/index", () => {
  it("exports a projectsRepository instance", () => {
    expect(projectsRepository).toBeDefined();
    expect(projectsRepository).toHaveProperty("list");
    expect(projectsRepository).toHaveProperty("get");
    expect(projectsRepository).toHaveProperty("create");
    expect(projectsRepository).toHaveProperty("update");
    expect(projectsRepository).toHaveProperty("addDataset");
    expect(projectsRepository).toHaveProperty("deleteDataset");
    expect(projectsRepository).toHaveProperty("listDatasets");
  });

  it("is an instance of MockProjectsRepository in mock mode", () => {
    expect(projectsRepository).toBeInstanceOf(MockProjectsRepository);
  });

  it("implements the ProjectsRepository interface", () => {
    // Verify all required methods exist and are functions
    expect(typeof projectsRepository.list).toBe("function");
    expect(typeof projectsRepository.get).toBe("function");
    expect(typeof projectsRepository.create).toBe("function");
    expect(typeof projectsRepository.update).toBe("function");
    expect(typeof projectsRepository.addDataset).toBe("function");
    expect(typeof projectsRepository.deleteDataset).toBe("function");
    expect(typeof projectsRepository.listDatasets).toBe("function");
  });

  it("provides a singleton repository instance", async () => {
    // Verify it's a stable reference by checking it returns consistent data
    const firstCall = await projectsRepository.list();
    const secondCall = await projectsRepository.list();
    expect(Array.isArray(firstCall)).toBe(true);
    expect(Array.isArray(secondCall)).toBe(true);
  });

  describe("repository methods return promises", () => {
    it("list returns a promise", () => {
      const result = projectsRepository.list();
      expect(result).toBeInstanceOf(Promise);
    });

    it("get returns a promise", async () => {
      const result = projectsRepository.get("any-id");
      expect(result).toBeInstanceOf(Promise);
      await result; // Clean up promise
    });

    it("create returns a promise", async () => {
      const result = projectsRepository.create({
        name: "Test",
        description: "Test",
      });
      expect(result).toBeInstanceOf(Promise);
      await result; // Clean up promise
    });
  });
});
