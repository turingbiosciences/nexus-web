'use client';

import Link from 'next/link';
import { Project } from '@/types/project';
import { Clock, Database } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Use project data directly - it now comes from the API with file_count and last_activity
  const datasetCount = project.datasetCount ?? 0;
  const lastActivity = project.lastActivity ?? 'No recent activity';

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {project.name}
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Database className="h-3.5 w-3.5" />
            <span>
              {datasetCount} dataset{datasetCount === 1 ? '' : 's'}
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
