/**
 * Projects API service
 * Handles fetching and managing projects from the backend API
 */

import { Project } from "@/types/project";

interface ProjectsAPIResponse {
  projects: Project[];
}

/**
 * Fetch projects list from the backend API
 * @param accessToken - Logto access token for authentication
 * @returns Promise resolving to array of projects
 */
export async function fetchProjects(accessToken: string): Promise<Project[]> {
  const baseUrl = process.env.NEXT_PUBLIC_TURING_API;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_TURING_API environment variable");
  }

  // Remove trailing slash if present
  const apiUrl = baseUrl.replace(/\/$/, "");

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

  const data = (await response.json()) as ProjectsAPIResponse;

  return data.projects || [];
}

/**
 * Create a new project via the backend API
 * @param accessToken - Logto access token for authentication
 * @param data - Project creation data
 * @returns Promise resolving to created project
 */
export async function createProject(
  accessToken: string,
  data: { name: string; description: string }
): Promise<Project> {
  const baseUrl = process.env.NEXT_PUBLIC_TURING_API;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_TURING_API environment variable");
  }

  const apiUrl = baseUrl.replace(/\/$/, "");

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

  return await response.json();
}
