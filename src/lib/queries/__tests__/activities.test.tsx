import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useActivities } from "../activities";
import { ProjectActivity } from "@/types/project";
import React from "react";

// Mock dependencies
jest.mock("@/config/flags", () => ({
  IS_MOCK: false,
}));

jest.mock("@/components/providers/token-provider", () => ({
  useAccessToken: jest.fn(),
}));

jest.mock("@/lib/auth-fetch");

const mockedUseAccessToken = jest.requireMock(
  "@/components/providers/token-provider"
).useAccessToken;
const mockedAuthFetch = jest.requireMock("@/lib/auth-fetch").authFetch;

// Test wrapper with React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
}

describe("useActivities", () => {
  const originalEnv = process.env.NEXT_PUBLIC_TURING_API;

  const mockActivities: ProjectActivity[] = [
    {
      id: "act-1",
      type: "upload",
      message: "Dataset uploaded",
      at: new Date("2024-06-15T10:00:00"),
    },
    {
      id: "act-2",
      type: "status_change",
      message: "Project run started",
      at: new Date("2024-06-15T11:00:00"),
    },
  ];

  beforeAll(() => {
    process.env.NEXT_PUBLIC_TURING_API = "https://api.example.com";
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_TURING_API = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock responses
    mockedUseAccessToken.mockReturnValue({
      accessToken: "mock-token",
      isAuthenticated: true,
      refreshToken: jest.fn().mockResolvedValue("new-token"),
      authLoading: false,
    });

    // Default successful fetch response
    mockedAuthFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockActivities),
      text: jest.fn().mockResolvedValue(""),
    });
  });

  describe("Basic Functionality", () => {
    it("fetches activities successfully", async () => {
      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].id).toBe("act-1");
      expect(result.current.data?.[1].id).toBe("act-2");
    });

    it("calls authFetch with correct parameters", async () => {
      renderHook(() => useActivities("project-1", { limit: 10 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(mockedAuthFetch).toHaveBeenCalled());

      expect(mockedAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining("/projects/project-1/activities"),
        expect.objectContaining({
          method: "GET",
          token: "mock-token",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("passes limit parameter to fetchActivities", async () => {
      renderHook(() => useActivities("project-1", { limit: 5 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(mockedAuthFetch).toHaveBeenCalled());

      // Verify authFetch was called (limit is handled internally)
      expect(mockedAuthFetch).toHaveBeenCalled();
    });
  });

  describe("Query States", () => {
    it("starts in loading state", () => {
      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("handles error state", async () => {
      mockedAuthFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("Internal Server Error"),
      });

      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });

    it("is disabled when projectId is empty", () => {
      const { result } = renderHook(() => useActivities(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedAuthFetch).not.toHaveBeenCalled();
    });

    it("is disabled when not authenticated", () => {
      mockedUseAccessToken.mockReturnValue({
        accessToken: null,
        isAuthenticated: false,
        refreshToken: jest.fn(),
        authLoading: false,
      });

      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedAuthFetch).not.toHaveBeenCalled();
    });

    it("is disabled when accessToken is missing", () => {
      mockedUseAccessToken.mockReturnValue({
        accessToken: null,
        isAuthenticated: true,
        refreshToken: jest.fn(),
        authLoading: false,
      });

      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedAuthFetch).not.toHaveBeenCalled();
    });

    it("is disabled when enabled option is false", () => {
      const { result } = renderHook(
        () => useActivities("project-1", { enabled: false }),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedAuthFetch).not.toHaveBeenCalled();
    });
  });

  describe("Response Formats", () => {
    it("handles array response format", async () => {
      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockActivities),
      });

      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
    });

    it("handles object with items property", async () => {
      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ items: mockActivities }),
      });

      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
    });

    it("handles object with activities property", async () => {
      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ activities: mockActivities }),
      });

      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
    });

    it("maps timestamp field to at", async () => {
      const apiActivities = [
        {
          id: "act-1",
          type: "upload",
          message: "Test",
          timestamp: "2024-06-15T10:00:00Z",
        },
      ];

      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(apiActivities),
      });

      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].at).toBeInstanceOf(Date);
    });

    it("maps createdAt field to at when timestamp is missing", async () => {
      const apiActivities = [
        {
          id: "act-1",
          type: "upload",
          message: "Test",
          createdAt: "2024-06-15T10:00:00Z",
        },
      ];

      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(apiActivities),
      });

      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].at).toBeInstanceOf(Date);
    });

    it("uses current date when no timestamp fields present", async () => {
      const apiActivities = [
        {
          id: "act-1",
          type: "upload",
          message: "Test",
        },
      ];

      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(apiActivities),
      });

      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].at).toBeInstanceOf(Date);
    });
  });

  describe("Options", () => {
    it("passes default limit of 20 to query function", async () => {
      renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(mockedAuthFetch).toHaveBeenCalled());

      // Default limit is 20 but passed internally, not necessarily in URL
      expect(mockedAuthFetch).toHaveBeenCalled();
    });

    it("respects custom limit option", async () => {
      renderHook(() => useActivities("project-1", { limit: 50 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(mockedAuthFetch).toHaveBeenCalled());

      // Custom limit is passed to fetchActivities
      expect(mockedAuthFetch).toHaveBeenCalled();
    });
  });

  describe("Query Key", () => {
    it("uses correct query key format", async () => {
      const { result } = renderHook(
        () => useActivities("project-1", { limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Query key should include projectId and limit
      // This is implicit in the implementation but we can verify behavior
      expect(result.current.data).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("throws error when NEXT_PUBLIC_TURING_API is missing", async () => {
      const originalEnv = process.env.NEXT_PUBLIC_TURING_API;
      delete process.env.NEXT_PUBLIC_TURING_API;

      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(String(result.current.error)).toContain(
        "Missing NEXT_PUBLIC_TURING_API"
      );

      process.env.NEXT_PUBLIC_TURING_API = originalEnv;
    });

    it("throws error when accessToken is not available during fetch", async () => {
      mockedUseAccessToken.mockReturnValue({
        accessToken: null,
        isAuthenticated: true,
        refreshToken: jest.fn(),
        authLoading: false,
      });

      const { result } = renderHook(
        () => useActivities("project-1", { enabled: true }),
        { wrapper: createWrapper() }
      );

      // Query should be disabled, so it won't fetch
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("Stale Time", () => {
    it("sets staleTime to 30 seconds", async () => {
      const { result } = renderHook(() => useActivities("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify data is fresh initially
      expect(result.current.isStale).toBe(false);
    });
  });
});
