import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProjectStatsCard } from '../project-stats-card';
import { Project } from '@/types/project';

// Mock the projects provider
jest.mock('@/components/providers/projects-provider', () => ({
  useProjects: jest.fn(),
}));

const mockedUseProjects = jest.requireMock(
  '@/components/providers/projects-provider'
).useProjects;

describe('ProjectStatsCard', () => {
  const baseProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test project description',
    datasetCount: 3,
    completedAt: new Date('2024-06-15T12:00:00'),
    createdAt: new Date('2024-01-15T12:00:00'),
    updatedAt: new Date('2024-06-10T12:00:00'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the component title', () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText('Project Statistics')).toBeInTheDocument();
    });

    it('renders all statistic items', () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText('Last Project Run')).toBeInTheDocument();
      expect(screen.getByText('Number of Datasets')).toBeInTheDocument();
      expect(screen.getByText('Last Updated')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
    });

    it('returns null when project is not found', () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(null),
      });

      const { container } = render(
        <ProjectStatsCard projectId="non-existent" />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Last Project Run Display', () => {
    it('displays formatted date when completedAt is set', () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument();
    });

    it("displays 'Never' when completedAt is not set", () => {
      const projectWithoutCompletion: Project = {
        ...baseProject,
        completedAt: undefined,
      };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(projectWithoutCompletion),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText('Never')).toBeInTheDocument();
    });
  });

  describe('Dataset Count Display', () => {
    it('displays dataset count when present', () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const datasetRow = screen
        .getByText('Number of Datasets')
        .closest('div')!.parentElement;
      expect(datasetRow).toHaveTextContent('3');
    });

    it('displays 0 when datasetCount is undefined', () => {
      const projectWithoutDatasets: Project = {
        ...baseProject,
        datasetCount: undefined,
      };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(projectWithoutDatasets),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const datasetRow = screen
        .getByText('Number of Datasets')
        .closest('div')!.parentElement;
      expect(datasetRow).toHaveTextContent('0');
    });

    it('displays 0 when datasetCount is 0', () => {
      const projectWithZeroDatasets: Project = {
        ...baseProject,
        datasetCount: 0,
      };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(projectWithZeroDatasets),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const datasetRow = screen
        .getByText('Number of Datasets')
        .closest('div')!.parentElement;
      expect(datasetRow).toHaveTextContent('0');
    });
  });

  describe('Date Formatting', () => {
    it('formats Last Updated date correctly', () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText('Jun 10, 2024')).toBeInTheDocument();
    });

    it('formats Created date correctly', () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });
  });

  describe('Visual Structure', () => {
    it('renders all statistics with icons', () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      const { container } = render(<ProjectStatsCard projectId="project-1" />);

      // Check for SVG icons (lucide-react renders as SVG elements)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });

    it('renders statistics in vertical list with borders', () => {
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(baseProject),
      });

      const { container } = render(<ProjectStatsCard projectId="project-1" />);

      const statsRows = container.querySelectorAll('.py-3');
      expect(statsRows.length).toBe(4); // 4 statistics rows (status removed)
    });
  });

  describe('Edge Cases', () => {
    it('handles maximum dataset count', () => {
      const projectWithMaxDatasets: Project = {
        ...baseProject,
        datasetCount: 9999,
      };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(projectWithMaxDatasets),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      const datasetRow = screen
        .getByText('Number of Datasets')
        .closest('div')!.parentElement;
      expect(datasetRow).toHaveTextContent('9999');
    });

    it('renders with same-day createdAt and updatedAt dates', () => {
      const sameDate = new Date('2024-06-15T12:00:00');
      const projectWithSameDate: Project = {
        ...baseProject,
        createdAt: sameDate,
        updatedAt: sameDate,
      };
      mockedUseProjects.mockReturnValue({
        getProjectById: jest.fn().mockReturnValue(projectWithSameDate),
      });

      render(<ProjectStatsCard projectId="project-1" />);

      // Should render both dates even though they're the same
      const dateElements = screen.getAllByText('Jun 15, 2024');
      expect(dateElements.length).toBeGreaterThanOrEqual(2);
    });
  });
});
