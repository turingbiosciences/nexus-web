/**
 * Projects API service
 * Handles fetching and managing projects from the backend API
 */

import { Project } from "@/types/project";
import { mockProjects } from "@/lib/mock-data";
import { logger } from "@/lib/logger";
import { getRelativeTime } from "@/lib/utils/date-utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawProject = any;

/**
 * Fetch projects list from the backend API or mock data
 * @param accessToken - Logto access token for authentication
 * @returns Promise resolving to array of projects
 */
export async function fetchProjects(accessToken: string): Promise<Project[]> {
  // Check if mock mode is enabled
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE;

  if (dataMode === "mock") {
    logger.debug("Using mock data (NEXT_PUBLIC_DATA_MODE=mock)");
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockProjects;
  }

  const baseUrl = process.env.NEXT_PUBLIC_TURING_API;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_TURING_API environment variable");
  }

  // Remove trailing slash if present
  const apiUrl = baseUrl.replace(/\/$/, "");

  logger.debug({ url: `${apiUrl}/projects` }, "Fetching projects from API");

  const response = await fetch(`${apiUrl}/projects`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to fetch projects: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();

  // Debug: Log full API response
  logger.debug(
    {
      responseType: typeof data,
      isArray: Array.isArray(data),
      hasProjectsProperty: "projects" in (data || {}),
    },
    "Projects API response received"
  );

  // Handle both array response and object with projects property
  const projectsArray: RawProject[] = Array.isArray(data)
    ? data
    : data?.projects || [];
  logger.debug({ count: projectsArray.length }, "Projects array extracted");

  // Normalize projects to ensure valid status values and convert date strings to Date objects
  const projects = projectsArray.map((project: RawProject) => {
    // Debug: Log individual project data before transformation
    logger.debug(
      {
        projectId: project.id,
        name: project.name,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        completedAt: project.completedAt,
      },
      "Processing raw project data"
    );

    // Helper to safely parse dates, fallback to current date if invalid
    const parseDate = (dateValue: string | Date | null | undefined): Date => {
      if (!dateValue) return new Date();
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const updatedAt = parseDate(project.updatedAt);
    const lastActivity = getRelativeTime(updatedAt);

    return {
      ...project,
      // Default to 'setup' if status is missing or invalid
      status:
        project.status === "complete" ||
        project.status === "running" ||
        project.status === "setup"
          ? project.status
          : "setup",
      // Convert date strings to Date objects with fallback
      createdAt: parseDate(project.createdAt),
      updatedAt,
      completedAt: project.completedAt
        ? parseDate(project.completedAt)
        : undefined,
      // Initialize datasetCount and lastActivity with defaults if not provided
      datasetCount: project.datasetCount ?? 0,
      lastActivity,
      datasets: project.datasets ?? [],
    };
  });

  logger.info({ count: projects.length }, "Returning normalized projects");
  return projects;
}

/**
 * Delete a project via the backend API
 * @param accessToken - Logto access token for authentication
 * @param projectId - ID of the project to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteProject(
  accessToken: string,
  projectId: string
): Promise<void> {
  // Check if mock mode is enabled
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE;

  if (dataMode === "mock") {
    logger.debug({ projectId }, "Mock deletion (NEXT_PUBLIC_DATA_MODE=mock)");
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_TURING_API;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_TURING_API environment variable");
  }

  const apiUrl = baseUrl.replace(/\/$/, "");

  logger.info(
    { projectId, url: `${apiUrl}/projects/${projectId}` },
    "Deleting project via API"
  );

  const response = await fetch(`${apiUrl}/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to delete project: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  logger.info({ projectId }, "Successfully deleted project");
}

/**
 * Create a new project via the backend API or mock
 * @param accessToken - Logto access token for authentication
 * @param data - Project creation data
 * @returns Promise resolving to created project
 */
export async function createProject(
  accessToken: string,
  data: { name: string; description: string }
): Promise<Project> {
  // Check if mock mode is enabled
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE;

  if (dataMode === "mock") {
    logger.debug(
      { name: data.name },
      "Using mock data (NEXT_PUBLIC_DATA_MODE=mock)"
    );
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Return mock project
    const newProject: Project = {
      id: `mock-${Date.now()}`,
      name: data.name,
      description: data.description,
      status: "setup",
      createdAt: new Date(),
      updatedAt: new Date(),
      datasets: [],
      datasetCount: 0,
      lastActivity: "just now",
    };
    return newProject;
  }

  const baseUrl = process.env.NEXT_PUBLIC_TURING_API;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_TURING_API environment variable");
  }

  const apiUrl = baseUrl.replace(/\/$/, "");

  logger.info(
    { name: data.name, url: `${apiUrl}/projects` },
    "Creating project via API"
  );

  const response = await fetch(`${apiUrl}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Failed to create project: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const project = await response.json();

  // Debug: Log full API response for created project
  logger.debug(
    { projectId: project.id, name: project.name },
    "Project created via API"
  );

  // Helper to safely parse dates, fallback to current date if invalid
  const parseDate = (dateValue: string | Date | null | undefined): Date => {
    if (!dateValue) return new Date();
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Normalize status to ensure it's valid and convert date strings to Date objects
  const updatedAt = parseDate(project.updatedAt);
  const lastActivity = getRelativeTime(updatedAt);

  return {
    ...project,
    status:
      project.status === "complete" ||
      project.status === "running" ||
      project.status === "setup"
        ? project.status
        : "setup",
    // Convert date strings to Date objects with fallback
    createdAt: parseDate(project.createdAt),
    updatedAt,
    completedAt: project.completedAt
      ? parseDate(project.completedAt)
      : undefined,
    // Initialize datasetCount and lastActivity with defaults if not provided
    datasetCount: project.datasetCount ?? 0,
    lastActivity,
    datasets: project.datasets ?? [],
  };
}
