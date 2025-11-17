"use client";

import Link from "next/link";
import { Project } from "@/types/project";
import { Clock, Database, CheckCircle, Play, Settings2 } from "lucide-react";
import { useProjectMetadata } from "@/lib/queries/project-metadata";
import { useEffect } from "react";
import { useProjects } from "@/components/providers/projects-provider";

interface ProjectCardProps {
  project: Project;
}

const statusConfig = {
  complete: {
    icon: CheckCircle,
    label: "Complete",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  running: {
    icon: Play,
    label: "Running",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  setup: {
    icon: Settings2,
    label: "Setup",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
};

export function ProjectCard({ project }: ProjectCardProps) {
  // Default to 'setup' if status is undefined or invalid
  const config = statusConfig[project.status] || statusConfig.setup;
  const StatusIcon = config.icon;

  // Fetch metadata for this project
  const { data: metadata, isLoading } = useProjectMetadata(project.id);
  const { updateProject } = useProjects();

  // Update project in provider when metadata loads
  useEffect(() => {
    if (metadata && !isLoading) {
      updateProject(project.id, {
        datasetCount: metadata.datasetCount,
        lastActivity: metadata.lastActivity,
      });
    }
  }, [metadata, isLoading, project.id, updateProject]);

  // Use metadata if available, otherwise use project data
  const datasetCount = metadata?.datasetCount ?? project.datasetCount ?? 0;
  const lastActivity =
    metadata?.lastActivity ?? project.lastActivity ?? "No recent activity";

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
            {project.name}
          </h3>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} ${config.border} border`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{config.label}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Database className="h-3.5 w-3.5" />
            <span>
              {datasetCount} dataset{datasetCount === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{lastActivity}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
