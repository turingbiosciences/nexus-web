import { fetchProjects, createProject } from "../projects";
import { mockProjects } from "@/lib/mock-data";

describe("projects API", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.restoreAllMocks();
  });

  describe("fetchProjects", () => {
    it("returns mock data when in mock mode", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "mock";

      const result = await fetchProjects("fake-token");

      expect(result).toEqual(mockProjects);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("throws error when NEXT_PUBLIC_TURING_API is missing", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      delete process.env.NEXT_PUBLIC_TURING_API;

      await expect(fetchProjects("test-token")).rejects.toThrow(
        "Missing NEXT_PUBLIC_TURING_API environment variable"
      );
    });

    it("fetches projects from API successfully", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com";

      const mockResponse = {
        projects: [
          {
            id: "1",
            name: "Test Project",
            description: "Test description",
            status: "active" as const,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-02"),
            datasets: [],
            datasetCount: 0,
            lastActivity: "2 days ago",
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchProjects("test-token");

      expect(result).toEqual(mockResponse.projects);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/projects",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
        }
      );
    });

    it("handles trailing slash in API URL", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com/";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: [] }),
      });

      await fetchProjects("test-token");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/projects",
        expect.any(Object)
      );
    });

    it("throws error when API request fails", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error details",
      });

      await expect(fetchProjects("test-token")).rejects.toThrow(
        "Failed to fetch projects: 500 Internal Server Error - Server error details"
      );
    });

    it("handles error when response text fails", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => {
          throw new Error("Cannot read text");
        },
      });

      await expect(fetchProjects("test-token")).rejects.toThrow(
        "Failed to fetch projects: 500 Internal Server Error - Unknown error"
      );
    });

    it("returns empty array when projects field is missing", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await fetchProjects("test-token");

      expect(result).toEqual([]);
    });
  });

  describe("createProject", () => {
    it("returns mock project when in mock mode", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "mock";

      const projectData = {
        name: "New Mock Project",
        description: "Mock description",
      };

      const result = await createProject("fake-token", projectData);

      expect(result).toMatchObject({
        name: projectData.name,
        description: projectData.description,
        status: "setup",
        datasets: [],
        datasetCount: 0,
      });
      expect(result.id).toMatch(/^mock-/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("throws error when NEXT_PUBLIC_TURING_API is missing", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      delete process.env.NEXT_PUBLIC_TURING_API;

      await expect(
        createProject("test-token", { name: "Test", description: "Test" })
      ).rejects.toThrow("Missing NEXT_PUBLIC_TURING_API environment variable");
    });

    it("creates project via API successfully", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com";

      const projectData = {
        name: "New Project",
        description: "Project description",
      };

      const mockCreatedProject = {
        id: "new-123",
        ...projectData,
        status: "setup" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        datasets: [],
        datasetCount: 0,
        lastActivity: "just now",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedProject,
      });

      const result = await createProject("test-token", projectData);

      expect(result).toEqual(mockCreatedProject);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/projects",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        }
      );
    });

    it("handles trailing slash in API URL for create", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com/";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "1", name: "Test", description: "Test" }),
      });

      await createProject("test-token", {
        name: "Test",
        description: "Test",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/projects",
        expect.any(Object)
      );
    });

    it("throws error when create API request fails", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => "Invalid project data",
      });

      await expect(
        createProject("test-token", { name: "Test", description: "Test" })
      ).rejects.toThrow(
        "Failed to create project: 400 Bad Request - Invalid project data"
      );
    });

    it("handles error when create response text fails", async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = "api";
      process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com";

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => {
          throw new Error("Cannot read text");
        },
      });

      await expect(
        createProject("test-token", { name: "Test", description: "Test" })
      ).rejects.toThrow(
        "Failed to create project: 500 Internal Server Error - Unknown error"
      );
    });
  });
});
