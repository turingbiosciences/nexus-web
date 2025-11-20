import React from "react";
import { render, screen } from "@testing-library/react";
import { ProjectActivityTab } from "../project-activity-tab";
import { useActivities } from "@/lib/queries/activities";
import { ProjectsProvider } from "@/components/providers/projects-provider";
import { TokenProvider } from "@/components/providers/token-provider";

// Mock the useActivities hook
jest.mock("@/lib/queries/activities");
const mockUseActivities = useActivities as jest.MockedFunction<
  typeof useActivities
>;

describe("ProjectActivityTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseActivities.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useActivities>);
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <TokenProvider>
        <ProjectsProvider initialProjects={[]}>{ui}</ProjectsProvider>
      </TokenProvider>
    );
  };

  it("renders ActivitiesSection with projectId", () => {
    renderWithProviders(<ProjectActivityTab projectId="test-project-123" />);

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(mockUseActivities).toHaveBeenCalledWith("test-project-123", {
      limit: 20,
    });
  });

  it("passes projectId prop to ActivitiesSection", () => {
    renderWithProviders(<ProjectActivityTab projectId="another-project-456" />);

    expect(mockUseActivities).toHaveBeenCalledWith("another-project-456", {
      limit: 20,
    });
  });
});
