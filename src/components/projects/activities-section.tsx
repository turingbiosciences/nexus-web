"use client";

import { useActivities } from "@/lib/queries/activities";
import { useProjects } from "@/components/providers/projects-provider";
import { getRelativeTime } from "@/lib/utils/date-utils";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivitiesSectionProps {
  projectId: string;
  limit?: number;
}

export function ActivitiesSection({
  projectId,
  limit = 20,
}: ActivitiesSectionProps) {
  const activitiesQuery = useActivities(projectId, { limit });
  const activitiesLoading = activitiesQuery.isLoading;
  const { updateProject, getProjectById } = useProjects();
  const project = getProjectById(projectId);

  // Sync lastActivity from the most recent activity
  useEffect(() => {
    const activities = activitiesQuery.data || [];
    if (activities && activities.length > 0 && !activitiesLoading && project) {
      // Find the most recent activity
      const mostRecent = [...activities].sort(
        (a, b) => b.at.getTime() - a.at.getTime()
      )[0];

      if (mostRecent) {
        const lastActivity = getRelativeTime(mostRecent.at);

        if (project.lastActivity !== lastActivity) {
          updateProject(projectId, { lastActivity });
        }
      }
    }
  }, [
    activitiesQuery.data,
    activitiesLoading,
    project,
    projectId,
    updateProject,
  ]);

  const activities = activitiesQuery.data || [];

  return (
    <div className="card">
      <h3 className="card-title">Recent Activity</h3>
      <div className="space-y-4">
        {activitiesLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton
                  variant="circle"
                  width="0.5rem"
                  height="0.5rem"
                  className="mt-1.5"
                />
                <div className="flex-1">
                  <Skeleton width="75%" height="0.75rem" className="mb-2" />
                  <Skeleton width="50%" height="0.5rem" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!activitiesLoading && (!activities || activities.length === 0) && (
          <p className="text-sm text-gray-600">No activity yet.</p>
        )}
        {!activitiesLoading && activities && activities.length > 0 && (
          <ul className="space-y-3">
            {[...activities]
              .sort((a, b) => b.at.getTime() - a.at.getTime())
              .slice(0, limit)
              .map((act) => (
                <li key={act.id} className="flex items-start gap-3 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 ${
                      act.type === "upload"
                        ? "bg-blue-500"
                        : act.type === "status_change"
                        ? "bg-yellow-500"
                        : act.type === "delete"
                        ? "bg-red-500"
                        : act.type === "updated"
                        ? "bg-gray-400"
                        : "bg-green-500"
                    }`}
                  />
                  <div>
                    <p className="text-gray-900 font-medium">{act.message}</p>
                    <p className="text-gray-600 text-xs">
                      {act.at.toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
