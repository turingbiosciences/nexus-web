import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectHeaderCard } from '@/components/projects/project-header-card';
import { Project } from '@/types/project';
import { createMockProject } from '@/lib/mock-factories';

describe('ProjectHeaderCard', () => {
  const mockOnRun = jest.fn();

  const baseProject: Project = createMockProject({
    id: 'project-1',
    name: 'Test Project',
    description: 'Test project description',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders project name and description', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test project description')).toBeInTheDocument();
    });

    it('renders Run button', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
    });

    it('renders project metadata inline', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      // New component shows status label inline and dataset count
      expect(screen.getByText('Setup')).toBeInTheDocument();
      expect(screen.getByText(/3 datasets/)).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it("displays 'Setup' status for setup projects", () => {
      const setupProject = { ...baseProject, status: 'setup' as const };

      render(
        <ProjectHeaderCard
          project={setupProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText('Setup')).toBeInTheDocument();
    });

    it("displays 'Complete' status for complete projects", () => {
      const completeProject = { ...baseProject, status: 'complete' as const };

      render(
        <ProjectHeaderCard
          project={completeProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it("displays 'Running' status for running projects", () => {
      const runningProject = { ...baseProject, status: 'running' as const };

      render(
        <ProjectHeaderCard
          project={runningProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  describe('Last Run Display', () => {
    it('displays formatted date when completedAt is set', () => {
      const projectWithCompletion: Project = {
        ...baseProject,
        completedAt: new Date('2024-06-15T12:00:00'),
      };

      render(
        <ProjectHeaderCard
          project={projectWithCompletion}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText(/Jun 15, 2024/)).toBeInTheDocument();
    });

    it("displays 'Never run' when completedAt is not set", () => {
      const projectWithoutCompletion = {
        ...baseProject,
        completedAt: undefined,
      };

      render(
        <ProjectHeaderCard
          project={projectWithoutCompletion}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText('Never run')).toBeInTheDocument();
    });
  });

  describe('Dataset Count Display', () => {
    it('displays dataset count when present', () => {
      const projectWithDatasets = {
        ...baseProject,
        datasetCount: 5,
      };

      render(
        <ProjectHeaderCard
          project={projectWithDatasets}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText(/5 datasets/)).toBeInTheDocument();
    });

    it('displays 0 when datasetCount is undefined', () => {
      const projectWithoutDatasets = {
        ...baseProject,
        datasetCount: undefined,
      };

      render(
        <ProjectHeaderCard
          project={projectWithoutDatasets}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText(/0 datasets/)).toBeInTheDocument();
    });

    it('displays 0 when datasetCount is 0', () => {
      const projectWithZeroDatasets = {
        ...baseProject,
        datasetCount: 0,
      };

      render(
        <ProjectHeaderCard
          project={projectWithZeroDatasets}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText(/0 datasets/)).toBeInTheDocument();
    });
  });

  describe('Run Button Behavior', () => {
    it('enables Run button when not running and has datasets', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const runButton = screen.getByRole('button', { name: /run/i });
      expect(runButton).not.toBeDisabled();
    });

    it('disables Run button when project is running', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={true}
          onRun={mockOnRun}
        />
      );

      const runButton = screen.getByRole('button', { name: /running/i });
      expect(runButton).toBeDisabled();
    });

    it("shows 'Running...' text when project is running", () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={true}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText('Running...')).toBeInTheDocument();
    });

    it('disables Run button when no datasets are present', () => {
      const projectWithoutDatasets = {
        ...baseProject,
        datasetCount: 0,
      };

      render(
        <ProjectHeaderCard
          project={projectWithoutDatasets}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const runButton = screen.getByRole('button', { name: /run/i });
      expect(runButton).toBeDisabled();
    });

    it('disables Run button when datasetCount is undefined', () => {
      const projectWithoutDatasets = {
        ...baseProject,
        datasetCount: undefined,
      };

      render(
        <ProjectHeaderCard
          project={projectWithoutDatasets}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const runButton = screen.getByRole('button', { name: /run/i });
      expect(runButton).toBeDisabled();
    });

    it('calls onRun when Run button is clicked', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const runButton = screen.getByRole('button', { name: /run/i });
      fireEvent.click(runButton);

      expect(mockOnRun).toHaveBeenCalledTimes(1);
    });

    it('does not call onRun when button is disabled', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={true}
          onRun={mockOnRun}
        />
      );

      const runButton = screen.getByRole('button', { name: /running/i });
      fireEvent.click(runButton);

      expect(mockOnRun).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles project with empty description', () => {
      const projectWithEmptyDesc = {
        ...baseProject,
        description: '',
      };

      render(
        <ProjectHeaderCard
          project={projectWithEmptyDesc}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('handles very long project names gracefully', () => {
      const projectWithLongName = {
        ...baseProject,
        name: 'This is a very long project name that should wrap properly in the UI without breaking the layout',
      };

      render(
        <ProjectHeaderCard
          project={projectWithLongName}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(
        screen.getByText(/This is a very long project name/)
      ).toBeInTheDocument();
    });

    it('handles very long descriptions gracefully', () => {
      const projectWithLongDesc = {
        ...baseProject,
        description:
          'This is a very long description that contains a lot of text and should wrap properly without breaking the layout or causing any visual issues in the component rendering',
      };

      render(
        <ProjectHeaderCard
          project={projectWithLongDesc}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(
        screen.getByText(/This is a very long description/)
      ).toBeInTheDocument();
    });

    it('renders correctly with large dataset count', () => {
      const projectWithManyDatasets = {
        ...baseProject,
        datasetCount: 9999,
      };

      render(
        <ProjectHeaderCard
          project={projectWithManyDatasets}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(screen.getByText(/9999 datasets/)).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('renders with complete status styling', () => {
      const completeProject = {
        ...baseProject,
        status: 'complete' as const,
        completedAt: new Date('2024-06-15'),
      };

      const { container } = render(
        <ProjectHeaderCard
          project={completeProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(container.querySelector('.text-green-600')).toBeInTheDocument();
    });

    it('renders with running status styling', () => {
      const runningProject = {
        ...baseProject,
        status: 'running' as const,
      };

      const { container } = render(
        <ProjectHeaderCard
          project={runningProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
    });

    it('renders with setup status styling', () => {
      const setupProject = {
        ...baseProject,
        status: 'setup' as const,
      };

      const { container } = render(
        <ProjectHeaderCard
          project={setupProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      expect(container.querySelector('.text-yellow-600')).toBeInTheDocument();
    });
  });

  describe('Metadata Grid Layout', () => {
    it('renders with correct layout', () => {
      const { container } = render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      // Check for the main card container
      const cardElement = container.querySelector('.card');
      expect(cardElement).toBeInTheDocument();
    });

    it('renders all metadata items with icons', () => {
      const { container } = render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      // Check for lucide icons (svg elements)
      const icons = container.querySelectorAll('svg');
      // Expect at least 4 icons: status icon, calendar, database, and play button icon
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Tooltip Accessibility', () => {
    it('tooltip button has correct ARIA attributes', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const tooltipButton = screen.getByRole('button', {
        name: 'Project description',
      });
      expect(tooltipButton).toBeInTheDocument();
      expect(tooltipButton).toHaveAttribute('aria-describedby');
      expect(tooltipButton).toHaveAttribute('type', 'button');
    });

    it("tooltip element has role='tooltip'", () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('Test project description');
    });

    it('tooltip button and tooltip are linked via aria-describedby', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const tooltipButton = screen.getByRole('button', {
        name: 'Project description',
      });
      const tooltip = screen.getByRole('tooltip');

      const ariaDescribedby = tooltipButton.getAttribute('aria-describedby');
      expect(ariaDescribedby).toBe(tooltip.id);
    });

    it('shows tooltip on focus', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const tooltipButton = screen.getByRole('button', {
        name: 'Project description',
      });
      const tooltip = screen.getByRole('tooltip');

      // Initially hidden
      expect(tooltip).toHaveClass('opacity-0');

      // Focus the button
      fireEvent.focus(tooltipButton);

      // Should be visible
      expect(tooltip).toHaveClass('opacity-100');
    });

    it('hides tooltip on blur', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const tooltipButton = screen.getByRole('button', {
        name: 'Project description',
      });
      const tooltip = screen.getByRole('tooltip');

      // Focus to show
      fireEvent.focus(tooltipButton);
      expect(tooltip).toHaveClass('opacity-100');

      // Blur to hide
      fireEvent.blur(tooltipButton);
      expect(tooltip).toHaveClass('opacity-0');
    });

    it('shows tooltip when Enter key is pressed', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const tooltipButton = screen.getByRole('button', {
        name: 'Project description',
      });
      const tooltip = screen.getByRole('tooltip');

      fireEvent.keyDown(tooltipButton, { key: 'Enter' });
      expect(tooltip).toHaveClass('opacity-100');
    });

    it('shows tooltip when Space key is pressed', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const tooltipButton = screen.getByRole('button', {
        name: 'Project description',
      });
      const tooltip = screen.getByRole('tooltip');

      fireEvent.keyDown(tooltipButton, { key: ' ' });
      expect(tooltip).toHaveClass('opacity-100');
    });

    it('hides tooltip when Escape key is pressed', () => {
      render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const tooltipButton = screen.getByRole('button', {
        name: 'Project description',
      });
      const tooltip = screen.getByRole('tooltip');

      // Show tooltip first
      fireEvent.focus(tooltipButton);
      expect(tooltip).toHaveClass('opacity-100');

      // Hide with Escape
      fireEvent.keyDown(tooltipButton, { key: 'Escape' });
      expect(tooltip).toHaveClass('opacity-0');
    });

    it('tooltip button has visible focus indicator', () => {
      const { container } = render(
        <ProjectHeaderCard
          project={baseProject}
          isRunning={false}
          onRun={mockOnRun}
        />
      );

      const tooltipButton = screen.getByRole('button', {
        name: 'Project description',
      });

      expect(tooltipButton).toHaveClass('focus:ring-2');
      expect(tooltipButton).toHaveClass('focus:ring-blue-500');
    });
  });
});
