"use client";

import Link from "next/link";
import { Project } from "@/types/project";
import { Clock, Database } from "lucide-react";
import { statusConfig } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}
export function ProjectCard({ project }: ProjectCardProps) {
  const config = statusConfig[project.status];
  const StatusIcon = config.icon;

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
          {project.datasetCount !== undefined && (
            <div className="flex items-center gap-1">
              <Database className="h-3.5 w-3.5" />
              <span>{project.datasetCount} datasets</span>
            </div>
          )}
          {project.lastActivity && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{project.lastActivity}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
