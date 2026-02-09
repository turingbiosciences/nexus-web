import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to persist the active job ID in localStorage to survive page reloads.
 */
export function useActiveJobPersistence(projectId: string) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Restore active job from local storage on mount
  useEffect(() => {
    const storedJobId = localStorage.getItem(`active_job_${projectId}`);
    if (storedJobId) {
      setActiveJobId(storedJobId);
    }
  }, [projectId]);

  const setJobId = useCallback(
    (jobId: string) => {
      setActiveJobId(jobId);
      localStorage.setItem(`active_job_${projectId}`, jobId);
    },
    [projectId]
  );

  const clearJobId = useCallback(() => {
    setActiveJobId(null);
    localStorage.removeItem(`active_job_${projectId}`);
  }, [projectId]);

  return {
    activeJobId,
    setJobId,
    clearJobId,
  };
}
