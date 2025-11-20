/**
 * Mock factory functions for common test data
 * Provides reusable data generators for tests
 */

import { Project, ProjectActivity, ProjectDataset } from "@/types/project";

/**
 * Creates a mock Project with sensible defaults
 */
export function createMockProject(overrides?: Partial<Project>): Project {
  return {
    id: "project-1",
    name: "Test Project",
    description: "Test Description",
    status: "setup",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    datasetCount: 3,
    ...overrides,
  };
}

/**
 * Creates multiple mock Projects
 */
export function createMockProjects(count: number, template?: Partial<Project>): Project[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProject({
      id: `project-${i + 1}`,
      name: `Project ${i + 1}`,
      ...template,
    })
  );
}

/**
 * Creates a mock ProjectDataset with sensible defaults
 */
export function createMockDataset(overrides?: Partial<ProjectDataset>): ProjectDataset {
  return {
    id: "ds-1",
    filename: "test.csv",
    size: 1024,
    uploadedAt: new Date("2024-06-15T10:00:00Z"),
    ...overrides,
  };
}

/**
 * Creates multiple mock ProjectDatasets
 */
export function createMockDatasets(count: number, template?: Partial<ProjectDataset>): ProjectDataset[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDataset({
      id: `ds-${i + 1}`,
      filename: `test${i + 1}.csv`,
      size: (i + 1) * 1024,
      uploadedAt: new Date(`2024-06-15T${10 + i}:00:00Z`),
      ...template,
    })
  );
}

/**
 * Creates a mock ProjectActivity with sensible defaults
 */
export function createMockActivity(overrides?: Partial<ProjectActivity>): ProjectActivity {
  return {
    id: "act-1",
    type: "upload",
    message: "Dataset uploaded",
    at: new Date("2024-06-15T10:00:00Z"),
    ...overrides,
  };
}

/**
 * Creates multiple mock ProjectActivities
 */
export function createMockActivities(
  count: number,
  template?: Partial<ProjectActivity>
): ProjectActivity[] {
  const types: ProjectActivity["type"][] = ["upload", "status_change", "created"];
  
  return Array.from({ length: count }, (_, i) =>
    createMockActivity({
      id: `act-${i + 1}`,
      type: types[i % types.length],
      message: `Activity ${i + 1}`,
      at: new Date(`2024-06-15T${10 + i}:00:00Z`),
      ...template,
    })
  );
}

/**
 * Creates a mock API dataset response (snake_case format)
 */
export function createMockApiDataset(dataset: ProjectDataset) {
  return {
    file_id: dataset.id,
    filename: dataset.filename,
    file_size: dataset.size,
    uploaded_at: dataset.uploadedAt.toISOString(),
  };
}

/**
 * Creates multiple mock API dataset responses
 */
export function createMockApiDatasets(datasets: ProjectDataset[]) {
  return datasets.map(createMockApiDataset);
}

/**
 * Creates a mock API activity response (snake_case format)
 */
export function createMockApiActivity(activity: ProjectActivity) {
  return {
    id: activity.id,
    type: activity.type,
    message: activity.message,
    timestamp: activity.at.toISOString(),
  };
}

/**
 * Creates multiple mock API activity responses
 */
export function createMockApiActivities(activities: ProjectActivity[]) {
  return activities.map(createMockApiActivity);
}
