import { render, screen } from '@testing-library/react';
import { ProjectCard } from '../project-card';
import { Project } from '@/types/project';

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

// Mock providers
jest.mock('@/components/providers/token-provider', () => ({
  useAccessToken: () => ({
    accessToken: 'mock-token',
    isLoading: false,
    error: null,
  }),
}));

const mockUpdateProject = jest.fn();
jest.mock('@/components/providers/projects-provider', () => ({
  useProjects: () => ({
    updateProject: mockUpdateProject,
  }),
}));

// Mock useProjectMetadata hook
jest.mock('@/lib/queries/project-metadata', () => ({
  useProjectMetadata: () => ({
    data: undefined,
    isLoading: false,
    error: null,
  }),
}));

describe('ProjectCard', () => {
  const baseProject: Project = {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'A test project description',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    datasetCount: 5,
    lastActivity: '2 days ago',
  };

  it('renders project name', () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders project description', () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText('A test project description')).toBeInTheDocument();
  });

  it('renders dataset count when provided', () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText('5 datasets')).toBeInTheDocument();
  });

  it('renders zero datasets when undefined', () => {
    const projectWithoutCount = { ...baseProject, datasetCount: undefined };
    render(<ProjectCard project={projectWithoutCount} />);
    expect(screen.getByText('0 datasets')).toBeInTheDocument();
  });

  it('renders last activity when provided', () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
  });

  it('renders default last activity when undefined', () => {
    const projectWithoutActivity = { ...baseProject, lastActivity: undefined };
    render(<ProjectCard project={projectWithoutActivity} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('links to project detail page', () => {
    render(<ProjectCard project={baseProject} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/projects/test-project-1');
  });

  it('truncates long project names', () => {
    const longNameProject = {
      ...baseProject,
      name: 'This is a very long project name that should be truncated',
    };
    render(<ProjectCard project={longNameProject} />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveClass('truncate');
  });

  it('clamps description to 2 lines', () => {
    const longDescProject = {
      ...baseProject,
      description:
        'This is a very long description that should be clamped to two lines maximum and anything beyond that should not be visible to the user',
    };
    render(<ProjectCard project={longDescProject} />);

    const description = screen.getByText(/This is a very long description/);
    expect(description).toHaveClass('line-clamp-2');
  });

  it('applies hover effect classes', () => {
    const { container } = render(<ProjectCard project={baseProject} />);

    const card = container.querySelector('.card');
    expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
  });

  it('renders with cursor pointer', () => {
    const { container } = render(<ProjectCard project={baseProject} />);

    const card = container.querySelector('.card');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('renders with minimum required fields only', () => {
    const minimalProject: Project = {
      id: 'minimal-1',
      name: 'Minimal Project',
      description: 'Minimal description',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    render(<ProjectCard project={minimalProject} />);

    expect(screen.getByText('Minimal Project')).toBeInTheDocument();
    expect(screen.getByText('Minimal description')).toBeInTheDocument();
    expect(screen.getByText('0 datasets')).toBeInTheDocument();
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });
});
