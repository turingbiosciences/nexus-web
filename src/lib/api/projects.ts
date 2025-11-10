/**
 * Projects API service
 * Handles fetching and managing projects from the backend API
 */

import { Project } from "@/types/project";
import { mockProjects } from "@/lib/mock-data";

interface ProjectsAPIResponse {
  projects: Project[];
}

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
    console.log("[fetchProjects] Using mock data (NEXT_PUBLIC_DATA_MODE=mock)");
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

  console.log(`[fetchProjects] Fetching from API: ${apiUrl}/projects`);

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
  console.log("[fetchProjects] API Response:", JSON.stringify(data, null, 2));
  console.log("[fetchProjects] API Response type:", typeof data);
  console.log("[fetchProjects] Is Array?", Array.isArray(data));
  console.log(
    "[fetchProjects] Has 'projects' property?",
    "projects" in (data || {})
  );

  // Handle both array response and object with projects property
  const projectsArray: RawProject[] = Array.isArray(data)
    ? data
    : data?.projects || [];
  console.log("[fetchProjects] Projects array length:", projectsArray.length);

  // Normalize projects to ensure valid status values and convert date strings to Date objects
  const projects = projectsArray.map((project: RawProject) => {
    // Debug: Log individual project data before transformation
    console.log("[fetchProjects] Raw project data:", {
      id: project.id,
      name: project.name,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      completedAt: project.completedAt,
    });

    // Helper to safely parse dates, fallback to current date if invalid
    const parseDate = (dateValue: string | Date | null | undefined): Date => {
      if (!dateValue) return new Date();
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

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
      updatedAt: parseDate(project.updatedAt),
      completedAt: project.completedAt
        ? parseDate(project.completedAt)
        : undefined,
    };
  });

  console.log(
    "[fetchProjects] Returning",
    projects.length,
    "normalized projects"
  );
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
    console.log(
      `[deleteProject] Mock deletion of project ${projectId} (NEXT_PUBLIC_DATA_MODE=mock)`
    );
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_TURING_API;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_TURING_API environment variable");
  }

  const apiUrl = baseUrl.replace(/\/$/, "");

  console.log(
    `[deleteProject] Deleting via API: ${apiUrl}/projects/${projectId}`
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

  console.log(`[deleteProject] Successfully deleted project ${projectId}`);
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
    console.log("[createProject] Using mock data (NEXT_PUBLIC_DATA_MODE=mock)");
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

  console.log(`[createProject] Creating via API: ${apiUrl}/projects`);

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
  console.log(
    "[createProject] API Response:",
    JSON.stringify(project, null, 2)
  );

  // Helper to safely parse dates, fallback to current date if invalid
  const parseDate = (dateValue: string | Date | null | undefined): Date => {
    if (!dateValue) return new Date();
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Normalize status to ensure it's valid and convert date strings to Date objects
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
    updatedAt: parseDate(project.updatedAt),
    completedAt: project.completedAt
      ? parseDate(project.completedAt)
      : undefined,
  };
}
