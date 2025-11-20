"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useDatasets } from "@/lib/queries/datasets";
import { Loader2 } from "lucide-react";

interface RunModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onConfirm: (datasetId: string, targetColumn: string) => void;
}

export function RunModelModal({
  isOpen,
  onClose,
  projectId,
  onConfirm,
}: RunModelModalProps) {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [targetColumn, setTargetColumn] = useState<string>("");

  // Fetch latest 3 datasets
  const { data: datasets, isLoading } = useDatasets(projectId, {
    enabled: isOpen,
    limit: 3,
  });

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDatasetId("");
      setTargetColumn("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedDatasetId && targetColumn) {
      onConfirm(selectedDatasetId, targetColumn);
      onClose();
    }
  };

  const canConfirm = selectedDatasetId && targetColumn.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start ML Training">
      <div className="space-y-6">
        {/* Dataset Selection */}
        <div>
          <label
            htmlFor="dataset-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Dataset
          </label>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : datasets && datasets.length > 0 ? (
            <select
              id="dataset-select"
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a dataset...</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.filename} (
                  {(dataset.size / 1024 / 1024).toFixed(2)} MB) -{" "}
                  {dataset.uploadedAt.toLocaleDateString()}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500 py-4">
              No datasets available. Please upload a dataset first.
            </p>
          )}
        </div>

        {/* Target Column Input */}
        <div>
          <label
            htmlFor="target-column"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Target Column
          </label>
          <input
            id="target-column"
            type="text"
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            placeholder="Enter target column name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedDatasetId}
          />
          <p className="mt-1 text-xs text-gray-500">
            The column name in your dataset to use as the prediction target
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
