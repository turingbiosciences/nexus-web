import React from "react";
import { render, screen } from "@testing-library/react";
import { ProjectActivityTab } from "../project-activity-tab";
import { useActivities } from "@/lib/queries/activities";

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
    } as any);
  });

  it("renders ActivitiesSection with projectId", () => {
    render(<ProjectActivityTab projectId="test-project-123" />);

    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(mockUseActivities).toHaveBeenCalledWith("test-project-123", {
      limit: 20,
    });
  });

  it("passes projectId prop to ActivitiesSection", () => {
    render(<ProjectActivityTab projectId="another-project-456" />);

    expect(mockUseActivities).toHaveBeenCalledWith("another-project-456", {
      limit: 20,
    });
  });
});
