"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Project } from "@/types/project";

interface ProjectSettingsTabProps {
  project: Project;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: () => Promise<void>;
  isDeleting: boolean;
}

export function ProjectSettingsTab({
  project,
  onUpdateProject,
  onDeleteProject,
  isDeleting,
}: ProjectSettingsTabProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    await onDeleteProject();
  };

  return (
    <div className="card">
      <h3 className="card-title">Project Settings</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <input
            type="text"
            defaultValue={project.name}
            onBlur={(e) =>
              onUpdateProject(project.id, { name: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            defaultValue={project.description}
            onBlur={(e) =>
              onUpdateProject(project.id, { description: e.target.value })
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="pt-4 border-t">
          <Button disabled>All changes auto-saved</Button>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 pt-6 border-t border-red-200">
          <h4 className="text-lg font-semibold text-red-600 mb-2">
            Danger Zone
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Once you delete a project, there is no going back. Please be
            certain.
          </p>
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Delete This Project
            </Button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-3">
                Are you absolutely sure you want to delete &quot;
                {project.name}&quot;?
              </p>
              <p className="text-sm text-red-700 mb-4">
                This action cannot be undone. All datasets and project data will
                be permanently deleted.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Project"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
