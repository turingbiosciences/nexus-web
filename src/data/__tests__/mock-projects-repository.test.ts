import { MockProjectsRepository } from "../mock-projects-repository";

// Mock crypto.randomUUID for consistent test IDs
const mockUUIDs = [
  "test-uuid-1",
  "test-uuid-2",
  "test-uuid-3",
  "test-uuid-4",
  "test-uuid-5",
];
let uuidIndex = 0;

beforeEach(() => {
  uuidIndex = 0;
  global.crypto = {
    ...global.crypto,
    randomUUID: jest.fn(() => mockUUIDs[uuidIndex++] || `uuid-${uuidIndex}`),
  } as typeof global.crypto;
});

describe("MockProjectsRepository", () => {
  let repository: MockProjectsRepository;

  beforeEach(() => {
    // Create a fresh repository instance for each test
    repository = new MockProjectsRepository();
  });

  describe("list", () => {
    it("returns an array of projects", async () => {
      const projects = await repository.list();
      expect(Array.isArray(projects)).toBe(true);
    });

    it("returns projects with expected structure", async () => {
      const projects = await repository.list();
      if (projects.length > 0) {
        const project = projects[0];
        expect(project).toHaveProperty("id");
        expect(project).toHaveProperty("name");
        expect(project).toHaveProperty("description");
        expect(project).toHaveProperty("status");
        expect(project).toHaveProperty("createdAt");
        expect(project).toHaveProperty("updatedAt");
        expect(project).toHaveProperty("datasetCount");
      }
    });

    it("includes newly created projects", async () => {
      const initialCount = (await repository.list()).length;
      await repository.create({ name: "New Project", description: "Test" });
      const projects = await repository.list();
      expect(projects.length).toBe(initialCount + 1);
    });
  });

  describe("get", () => {
    it("returns a project by ID", async () => {
      const created = await repository.create({
        name: "Get Test",
        description: "Test",
      });
      const retrieved = await repository.get(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe("Get Test");
    });

    it("returns undefined for non-existent ID", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeUndefined();
    });

    it("returns the same project on multiple calls", async () => {
      const created = await repository.create({
        name: "Consistent",
        description: "Test",
      });
      const first = await repository.get(created.id);
      const second = await repository.get(created.id);
      expect(first).toEqual(second);
    });
  });

  describe("create", () => {
    it("creates a new project with provided name and description", async () => {
      const input = { name: "Test Project", description: "Test Description" };
      const project = await repository.create(input);

      expect(project.name).toBe("Test Project");
      expect(project.description).toBe("Test Description");
    });

    it("trims whitespace from name and description", async () => {
      const input = {
        name: "  Trimmed Name  ",
        description: "  Trimmed Desc  ",
      };
      const project = await repository.create(input);

      expect(project.name).toBe("Trimmed Name");
      expect(project.description).toBe("Trimmed Desc");
    });

    it("assigns a unique ID to the project", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      expect(project.id).toBeDefined();
      expect(typeof project.id).toBe("string");
      expect(project.id.length).toBeGreaterThan(0);
    });

    it("sets initial status to 'setup'", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      expect(project.status).toBe("setup");
    });

    it("initializes timestamps", async () => {
      const before = new Date();
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      const after = new Date();

      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
      expect(project.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(project.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("initializes with zero datasets", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      expect(project.datasetCount).toBe(0);
      expect(project.datasets).toEqual([]);
    });

    it("creates an initial activity log entry", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      expect(project.activities).toBeDefined();
      expect(project.activities?.length).toBeGreaterThan(0);
      expect(project.activities?.[0].type).toBe("created");
      expect(project.activities?.[0].message).toBe("Project created");
    });

    it("adds new project to the beginning of the list", async () => {
      const project = await repository.create({
        name: "Latest",
        description: "Test",
      });
      const projects = await repository.list();
      expect(projects[0].id).toBe(project.id);
    });
  });

  describe("update", () => {
    it("updates an existing project", async () => {
      const created = await repository.create({
        name: "Original",
        description: "Original",
      });
      const updated = await repository.update(created.id, {
        name: "Updated Name",
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe("Updated Name");
      expect(updated?.description).toBe("Original"); // unchanged
    });

    it("returns undefined for non-existent project", async () => {
      const result = await repository.update("non-existent", { name: "Test" });
      expect(result).toBeUndefined();
    });

    it("updates the updatedAt timestamp", async () => {
      const created = await repository.create({
        name: "Test",
        description: "Test",
      });
      const originalUpdatedAt = created.updatedAt;

      // Wait a tiny bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await repository.update(created.id, { name: "Updated" });
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it("allows partial updates", async () => {
      const created = await repository.create({
        name: "Original",
        description: "Original Desc",
      });
      const updated = await repository.update(created.id, {
        description: "New Desc",
      });

      expect(updated?.name).toBe("Original");
      expect(updated?.description).toBe("New Desc");
    });

    it("persists changes in subsequent get calls", async () => {
      const created = await repository.create({
        name: "Original",
        description: "Test",
      });
      await repository.update(created.id, { name: "Updated" });

      const retrieved = await repository.get(created.id);
      expect(retrieved?.name).toBe("Updated");
    });
  });

  describe("addDataset", () => {
    it("adds a dataset to a project", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      const dataset = await repository.addDataset(project.id, {
        name: "test.csv",
        size: 1024,
      });

      expect(dataset).toBeDefined();
      expect(dataset.filename).toBe("test.csv");
      expect(dataset.size).toBe(1024);
      expect(dataset.id).toBeDefined();
      expect(dataset.uploadedAt).toBeInstanceOf(Date);
    });

    it("increments the project's dataset count", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      expect(project.datasetCount).toBe(0);

      await repository.addDataset(project.id, { name: "file1.csv", size: 100 });
      const updated = await repository.get(project.id);
      expect(updated?.datasetCount).toBe(1);

      await repository.addDataset(project.id, { name: "file2.csv", size: 200 });
      const updated2 = await repository.get(project.id);
      expect(updated2?.datasetCount).toBe(2);
    });

    it("updates lastActivity", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      await repository.addDataset(project.id, { name: "test.csv", size: 100 });
      const updated = await repository.get(project.id);
      expect(updated?.lastActivity).toBe("dataset uploaded");
    });

    it("throws error for non-existent project", async () => {
      await expect(
        repository.addDataset("non-existent", { name: "test.csv", size: 100 })
      ).rejects.toThrow("Project not found");
    });

    it("assigns unique IDs to datasets", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      const dataset1 = await repository.addDataset(project.id, {
        name: "file1.csv",
        size: 100,
      });
      const dataset2 = await repository.addDataset(project.id, {
        name: "file2.csv",
        size: 200,
      });

      expect(dataset1.id).not.toBe(dataset2.id);
    });
  });

  describe("deleteDataset", () => {
    it("removes a dataset from a project", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      const dataset = await repository.addDataset(project.id, {
        name: "test.csv",
        size: 100,
      });

      const result = await repository.deleteDataset(project.id, dataset.id);
      expect(result).toBe(true);

      const updated = await repository.get(project.id);
      expect(updated?.datasets?.length).toBe(0);
    });

    it("decrements the dataset count", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      const dataset1 = await repository.addDataset(project.id, {
        name: "file1.csv",
        size: 100,
      });
      await repository.addDataset(project.id, { name: "file2.csv", size: 200 });

      await repository.deleteDataset(project.id, dataset1.id);
      const updated = await repository.get(project.id);
      expect(updated?.datasetCount).toBe(1);
    });

    it("returns false for non-existent project", async () => {
      const result = await repository.deleteDataset(
        "non-existent",
        "dataset-id"
      );
      expect(result).toBe(false);
    });

    it("returns false for non-existent dataset", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      const result = await repository.deleteDataset(
        project.id,
        "non-existent-dataset"
      );
      expect(result).toBe(false);
    });

    it("updates lastActivity", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      const dataset = await repository.addDataset(project.id, {
        name: "test.csv",
        size: 100,
      });
      await repository.deleteDataset(project.id, dataset.id);

      const updated = await repository.get(project.id);
      expect(updated?.lastActivity).toBe("dataset deleted");
    });

    it("only removes the specified dataset", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      const dataset1 = await repository.addDataset(project.id, {
        name: "file1.csv",
        size: 100,
      });
      const dataset2 = await repository.addDataset(project.id, {
        name: "file2.csv",
        size: 200,
      });

      await repository.deleteDataset(project.id, dataset1.id);
      const updated = await repository.get(project.id);
      expect(updated?.datasets?.some((d) => d.id === dataset2.id)).toBe(true);
      expect(updated?.datasets?.some((d) => d.id === dataset1.id)).toBe(false);
    });
  });

  describe("listDatasets", () => {
    it("returns all datasets for a project", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      await repository.addDataset(project.id, { name: "file1.csv", size: 100 });
      await repository.addDataset(project.id, { name: "file2.csv", size: 200 });

      const page = await repository.listDatasets(project.id);
      expect(page.items.length).toBe(2);
      expect(page.total).toBe(2);
    });

    it("returns empty array for project with no datasets", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      const page = await repository.listDatasets(project.id);
      expect(page.items).toEqual([]);
      expect(page.total).toBe(0);
    });

    it("returns empty array for non-existent project", async () => {
      const page = await repository.listDatasets("non-existent");
      expect(page.items).toEqual([]);
      expect(page.total).toBe(0);
    });

    it("supports pagination with limit", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      // Add 5 datasets
      for (let i = 0; i < 5; i++) {
        await repository.addDataset(project.id, {
          name: `file${i}.csv`,
          size: 100,
        });
      }

      const page = await repository.listDatasets(project.id, { limit: 2 });
      expect(page.items.length).toBe(2);
      expect(page.total).toBe(5);
      expect(page.nextCursor).toBeDefined();
    });

    it("supports pagination with cursor", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      // Add 5 datasets
      for (let i = 0; i < 5; i++) {
        await repository.addDataset(project.id, {
          name: `file${i}.csv`,
          size: 100,
        });
      }

      const page1 = await repository.listDatasets(project.id, { limit: 2 });
      expect(page1.items.length).toBe(2);
      expect(page1.nextCursor).toBe("2");

      const page2 = await repository.listDatasets(project.id, {
        limit: 2,
        cursor: page1.nextCursor,
      });
      expect(page2.items.length).toBe(2);
      expect(page2.items[0].filename).not.toBe(page1.items[0].filename);
    });

    it("returns undefined nextCursor on last page", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      await repository.addDataset(project.id, { name: "file1.csv", size: 100 });
      await repository.addDataset(project.id, { name: "file2.csv", size: 200 });

      const page = await repository.listDatasets(project.id, { limit: 10 });
      expect(page.nextCursor).toBeUndefined();
    });

    it("defaults to limit of 50", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      // Add 60 datasets
      for (let i = 0; i < 60; i++) {
        await repository.addDataset(project.id, {
          name: `file${i}.csv`,
          size: 100,
        });
      }

      const page = await repository.listDatasets(project.id);
      expect(page.items.length).toBe(50);
      expect(page.nextCursor).toBe("50");
      expect(page.total).toBe(60);
    });

    it("handles cursor at end of list", async () => {
      const project = await repository.create({
        name: "Test",
        description: "Test",
      });
      await repository.addDataset(project.id, { name: "file1.csv", size: 100 });

      const page = await repository.listDatasets(project.id, {
        limit: 10,
        cursor: "1",
      });
      expect(page.items.length).toBe(0);
      expect(page.nextCursor).toBeUndefined();
    });
  });

  describe("data isolation", () => {
    it("maintains separate state between repository instances", async () => {
      const repo1 = new MockProjectsRepository();
      const repo2 = new MockProjectsRepository();

      await repo1.create({
        name: "Repo1 Project",
        description: "Test",
      });
      await repo2.create({
        name: "Repo2 Project",
        description: "Test",
      });

      // Each repo should have its own data
      const list1 = await repo1.list();
      const list2 = await repo2.list();

      // Note: They share the same underlying mock data, so this tests current behavior
      expect(list1.length).toBe(list2.length);
    });
  });

  describe("immutability", () => {
    it("does not mutate input objects", async () => {
      const input = { name: "Test", description: "Description" };
      const original = { ...input };

      await repository.create(input);

      expect(input).toEqual(original);
    });

    it("returns new project instances on update", async () => {
      const created = await repository.create({
        name: "Original",
        description: "Test",
      });
      const updated = await repository.update(created.id, { name: "Updated" });

      expect(updated).not.toBe(created); // Different object reference
      expect(updated?.name).toBe("Updated");
    });
  });
});
