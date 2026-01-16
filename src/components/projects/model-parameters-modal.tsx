"use client";

import { Modal } from "@/components/ui/modal";

interface ModelParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
  bestConfig: string;
  parameters: Record<string, unknown>;
}

export function ModelParametersModal({
  isOpen,
  onClose,
  modelName,
  bestConfig,
  parameters,
}: ModelParametersModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${modelName} Parameters`}>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">
            Best Configuration
          </h4>
          <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">
            {bestConfig}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Model Parameters
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(parameters).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-start gap-4 p-2 bg-gray-50 rounded text-sm"
              >
                <span className="font-medium text-gray-700">{key}</span>
                <span className="font-mono text-gray-900 text-right break-words">
                  {value === null
                    ? "null"
                    : typeof value === "number"
                    ? value.toFixed(value % 1 === 0 ? 0 : 3)
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
