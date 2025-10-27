export const datasetsKey = (projectId: string, cursor?: string, limit?: number) => ["datasets", projectId, cursor, limit] as const;
