import { DATA_MODE } from "@/config/flags";
import { MockProjectsRepository } from "./mock-projects-repository";
import { ProjectsRepository } from "./projects-repository";

// Placeholder: future ApiProjectsRepository can be added here

let repo: ProjectsRepository;

if (DATA_MODE === "live") {
  // For now still use mock until API exists
  repo = new MockProjectsRepository();
} else {
  repo = new MockProjectsRepository();
}

export const projectsRepository = repo;
