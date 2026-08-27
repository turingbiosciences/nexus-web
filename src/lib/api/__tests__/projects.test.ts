import { fetchProjects, createProject, getDashboardStats } from '../projects';
import { mockProjects, mockDashboardStats } from '@/lib/mock-data';

describe('projects API', () => {
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

  describe('fetchProjects', () => {
    it('returns mock data when in mock mode', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'mock';

      const result = await fetchProjects();

      expect(result).toEqual(mockProjects);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('fetches projects from API successfully', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'api';

      const now = new Date();
      const mockResponse = {
        projects: [
          {
            id: '1',
            name: 'Test Project',
            description: 'Test description',
            createdAt: new Date(now.getTime() - 86400000), // 1 day ago
            updatedAt: new Date(now.getTime() - 3600000), // 1 hour ago
            datasets: [],
            datasetCount: 0,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchProjects();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Test Project',
        description: 'Test description',
        datasets: [],
        datasetCount: 0,
      });
      // lastActivity is calculated from updatedAt, so just verify it exists
      expect(result[0].lastActivity).toBeDefined();
      expect(typeof result[0].lastActivity).toBe('string');
      expect(global.fetch).toHaveBeenCalledWith('/api/turing/projects', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('throws error when API request fails', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'api';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error details',
      });

      await expect(fetchProjects()).rejects.toThrow(
        'Failed to fetch projects: 500 Internal Server Error - Server error details'
      );
    });

    it('handles error when response text fails', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'api';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => {
          throw new Error('Cannot read text');
        },
      });

      await expect(fetchProjects()).rejects.toThrow(
        'Failed to fetch projects: 500 Internal Server Error - Unknown error'
      );
    });

    it('returns empty array when projects field is missing', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'api';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await fetchProjects();

      expect(result).toEqual([]);
    });
  });

  describe('createProject', () => {
    it('returns mock project when in mock mode', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'mock';

      const projectData = {
        name: 'New Mock Project',
        description: 'Mock description',
      };

      const result = await createProject(projectData);

      expect(result).toMatchObject({
        name: projectData.name,
        description: projectData.description,
        datasets: [],
        datasetCount: 0,
      });
      expect(result.id).toMatch(/^mock-/);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('creates project via API successfully', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'api';

      const projectData = {
        name: 'New Project',
        description: 'Project description',
      };

      const mockCreatedProject = {
        id: 'new-123',
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
        datasets: [],
        datasetCount: 0,
        lastActivity: 'just now',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedProject,
      });

      const result = await createProject(projectData);

      expect(result).toMatchObject({
        id: 'new-123',
        name: projectData.name,
        description: projectData.description,
        datasets: [],
        datasetCount: 0,
        lastActivity: 'just now',
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(global.fetch).toHaveBeenCalledWith('/api/turing/projects', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
    });

    it('throws error when create API request fails', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'api';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid project data',
      });

      await expect(
        createProject({ name: 'Test', description: 'Test' })
      ).rejects.toThrow(
        'Failed to create project: 400 Bad Request - Invalid project data'
      );
    });

    it('handles error when create response text fails', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'api';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => {
          throw new Error('Cannot read text');
        },
      });

      await expect(
        createProject({ name: 'Test', description: 'Test' })
      ).rejects.toThrow(
        'Failed to create project: 500 Internal Server Error - Unknown error'
      );
    });
  });

  describe('getDashboardStats', () => {
    it('returns mock data when in mock mode', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'mock';

      const result = await getDashboardStats();

      expect(result).toEqual(mockDashboardStats);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('fetches dashboard stats from API successfully', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'api';

      const mockResponse = {
        total_projects: 5,
        total_ml_runs: 12,
        algorithm_wins: { random_forest: 4 },
        total_runtime_seconds: 5000,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getDashboardStats();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/turing/dashboard/stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('throws error when API request fails', async () => {
      process.env.NEXT_PUBLIC_DATA_MODE = 'api';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(getDashboardStats()).rejects.toThrow(
        'Failed to fetch dashboard stats: 500 Internal Server Error - Server error'
      );
    });
  });
});
