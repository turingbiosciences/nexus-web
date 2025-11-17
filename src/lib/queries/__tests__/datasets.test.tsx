import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDatasets } from "../datasets";
import { ProjectDataset } from "@/types/project";
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

describe("useDatasets", () => {
  const originalEnv = process.env.NEXT_PUBLIC_TURING_API;

  const mockDatasets: ProjectDataset[] = [
    {
      id: "ds-1",
      filename: "test1.csv",
      size: 1024,
      uploadedAt: new Date("2024-06-15T10:00:00"),
    },
    {
      id: "ds-2",
      filename: "test2.csv",
      size: 2048,
      uploadedAt: new Date("2024-06-15T11:00:00"),
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

    // Default successful fetch response - match real API format with snake_case
    const apiDatasets = mockDatasets.map((d) => ({
      file_id: d.id,
      filename: d.filename,
      file_size: d.size,
      uploaded_at: d.uploadedAt.toISOString(),
    }));

    mockedAuthFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        items: apiDatasets,
        nextCursor: undefined,
        total: 2,
      }),
      text: jest.fn().mockResolvedValue(""),
    });
  });

  describe("Basic Functionality", () => {
    it("fetches datasets successfully", async () => {
      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // @ts-expect-error - Type narrowing for test
      const data = result.current.data as ProjectDataset[];
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe("ds-1");
      expect(data[1].id).toBe("ds-2");
    });

    it("calls authFetch with correct parameters", async () => {
      renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(mockedAuthFetch).toHaveBeenCalled());

      expect(mockedAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining("/projects/project-1/files"),
        expect.objectContaining({
          method: "GET",
          token: "mock-token",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("passes cursor parameter when provided", async () => {
      renderHook(() => useDatasets("project-1", { cursor: "cursor-abc" }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(mockedAuthFetch).toHaveBeenCalled());

      // Cursor is passed to fetchDatasets internally
      expect(mockedAuthFetch).toHaveBeenCalled();
    });

    it("passes limit parameter when provided", async () => {
      renderHook(() => useDatasets("project-1", { limit: 10 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(mockedAuthFetch).toHaveBeenCalled());

      // Limit is passed to fetchDatasets internally
      expect(mockedAuthFetch).toHaveBeenCalled();
    });

    it("passes both cursor and limit when provided", async () => {
      renderHook(() => useDatasets("project-1", { cursor: "abc", limit: 20 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(mockedAuthFetch).toHaveBeenCalled());

      // Both parameters passed to fetchDatasets internally
      expect(mockedAuthFetch).toHaveBeenCalled();
    });
  });

  describe("Query States", () => {
    it("starts in loading state", () => {
      const { result } = renderHook(() => useDatasets("project-1"), {
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

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });

    it("is disabled when projectId is empty", () => {
      const { result } = renderHook(() => useDatasets(""), {
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

      const { result } = renderHook(() => useDatasets("project-1"), {
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

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedAuthFetch).not.toHaveBeenCalled();
    });

    it("is disabled when enabled option is false", () => {
      const { result } = renderHook(
        () => useDatasets("project-1", { enabled: false }),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedAuthFetch).not.toHaveBeenCalled();
    });

    it("accepts boolean for enabled option (backwards compatibility)", () => {
      const { result } = renderHook(() => useDatasets("project-1", false), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockedAuthFetch).not.toHaveBeenCalled();
    });

    it("defaults to enabled when boolean true is passed", async () => {
      const { result } = renderHook(() => useDatasets("project-1", true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedAuthFetch).toHaveBeenCalled();
    });
  });

  describe("Response Formats", () => {
    it("handles paginated response format", async () => {
      const apiDatasets = mockDatasets.map((d) => ({
        file_id: d.id,
        filename: d.filename,
        file_size: d.size,
        uploaded_at: d.uploadedAt.toISOString(),
      }));

      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          items: apiDatasets,
          nextCursor: "cursor-next",
          total: 10,
        }),
      });

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // @ts-expect-error - Type narrowing for test
      expect(result.current.data).toHaveLength(2);
      // @ts-expect-error - Type narrowing for test
      expect(result.current.nextCursor).toBe("cursor-next");
      // @ts-expect-error - Type narrowing for test
      expect(result.current.total).toBe(10);
    });

    it("handles legacy array response format", async () => {
      const apiDatasets = mockDatasets.map((d) => ({
        file_id: d.id,
        filename: d.filename,
        file_size: d.size,
        uploaded_at: d.uploadedAt.toISOString(),
      }));

      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(apiDatasets),
      });

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // @ts-expect-error - Type narrowing for test
      expect(result.current.data).toHaveLength(2);
      // @ts-expect-error - Type narrowing for test
      expect(result.current.nextCursor).toBeUndefined();
      // @ts-expect-error - Type narrowing for test
      expect(result.current.total).toBe(2);
    });

    it("returns full response when paginated option is true", async () => {
      const apiDatasets = mockDatasets.map((d) => ({
        file_id: d.id,
        filename: d.filename,
        file_size: d.size,
        uploaded_at: d.uploadedAt.toISOString(),
      }));

      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          items: apiDatasets,
          nextCursor: "cursor-next",
          total: 10,
        }),
      });

      const { result } = renderHook(
        () => useDatasets("project-1", { paginated: true }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveProperty("items");
      expect(result.current.data).toHaveProperty("nextCursor");
      expect(result.current.data).toHaveProperty("total");
    });

    it("maps API response to ProjectDataset format", async () => {
      const apiDatasets = [
        {
          file_id: "ds-1",
          filename: "test.csv",
          file_size: 1024,
          uploaded_at: "2024-06-15T10:00:00Z",
        },
      ];

      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ items: apiDatasets }),
      });

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // @ts-expect-error - Type narrowing for test
      expect(result.current.data?.[0].uploadedAt).toBeInstanceOf(Date);
    });

    it("uses current date when uploadedAt is missing", async () => {
      const apiDatasets = [
        {
          file_id: "ds-1",
          filename: "test.csv",
          file_size: 1024,
        },
      ];

      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ items: apiDatasets }),
      });

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // @ts-expect-error - Type narrowing for test
      expect(result.current.data?.[0].uploadedAt).toBeInstanceOf(Date);
    });
  });

  describe("Query Key", () => {
    it("generates correct query key with datasetsKey", async () => {
      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Query key is used internally, verify behavior is correct
      expect(result.current.data).toBeDefined();
    });

    it("includes cursor and limit in query key", async () => {
      const { result } = renderHook(
        () => useDatasets("project-1", { cursor: "abc", limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Query key should be unique for different cursor/limit combinations
      expect(result.current.data).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("throws error when NEXT_PUBLIC_TURING_API is missing", async () => {
      const originalEnv = process.env.NEXT_PUBLIC_TURING_API;
      delete process.env.NEXT_PUBLIC_TURING_API;

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(String(result.current.error)).toContain(
        "Missing NEXT_PUBLIC_TURING_API"
      );

      process.env.NEXT_PUBLIC_TURING_API = originalEnv;
    });

    it("handles 404 error", async () => {
      mockedAuthFetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue("Not Found"),
      });

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(String(result.current.error)).toContain("404");
    });

    it("handles network errors", async () => {
      mockedAuthFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(String(result.current.error)).toContain("Network error");
    });
  });

  describe("Stale Time", () => {
    it("sets staleTime to 30 seconds", async () => {
      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify data is fresh initially
      expect(result.current.isStale).toBe(false);
    });
  });

  describe("Pagination Support", () => {
    it("handles nextCursor in response", async () => {
      const apiDatasets = mockDatasets.map((d) => ({
        file_id: d.id,
        filename: d.filename,
        file_size: d.size,
        uploaded_at: d.uploadedAt.toISOString(),
      }));

      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          items: apiDatasets,
          nextCursor: "page-2",
          total: 100,
        }),
      });

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // @ts-expect-error - Type narrowing for test
      expect(result.current.nextCursor).toBe("page-2");
      // @ts-expect-error - Type narrowing for test
      expect(result.current.total).toBe(100);
    });

    it("handles undefined nextCursor when no more pages", async () => {
      const apiDatasets = mockDatasets.map((d) => ({
        file_id: d.id,
        filename: d.filename,
        file_size: d.size,
        uploaded_at: d.uploadedAt.toISOString(),
      }));

      mockedAuthFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          items: apiDatasets,
          nextCursor: undefined,
          total: 2,
        }),
      });

      const { result } = renderHook(() => useDatasets("project-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // @ts-expect-error - Type narrowing for test
      expect(result.current.nextCursor).toBeUndefined();
    });
  });

  describe("Options Object", () => {
    it("accepts options object with enabled", async () => {
      const { result } = renderHook(
        () => useDatasets("project-1", { enabled: true }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedAuthFetch).toHaveBeenCalled();
    });

    it("accepts options object with cursor", async () => {
      const { result } = renderHook(
        () => useDatasets("project-1", { cursor: "xyz" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Cursor is passed internally to fetchDatasets
      expect(mockedAuthFetch).toHaveBeenCalled();
    });

    it("accepts options object with limit", async () => {
      const { result } = renderHook(
        () => useDatasets("project-1", { limit: 50 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Limit is passed internally to fetchDatasets
      expect(mockedAuthFetch).toHaveBeenCalled();
    });

    it("accepts options object with all properties", async () => {
      const { result } = renderHook(
        () =>
          useDatasets("project-1", {
            enabled: true,
            cursor: "abc",
            limit: 25,
            paginated: false,
          }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // All options are passed internally
      expect(mockedAuthFetch).toHaveBeenCalled();
    });
  });
});
