import { datasetsKey } from "../keys";

describe("datasetsKey", () => {
  it("generates query key with projectId only", () => {
    const key = datasetsKey("project-1");
    expect(key).toEqual(["datasets", "project-1", undefined, undefined]);
  });

  it("generates query key with projectId and cursor", () => {
    const key = datasetsKey("project-1", "cursor-abc");
    expect(key).toEqual(["datasets", "project-1", "cursor-abc", undefined]);
  });

  it("generates query key with projectId and limit", () => {
    const key = datasetsKey("project-1", undefined, 20);
    expect(key).toEqual(["datasets", "project-1", undefined, 20]);
  });

  it("generates query key with all parameters", () => {
    const key = datasetsKey("project-1", "cursor-xyz", 50);
    expect(key).toEqual(["datasets", "project-1", "cursor-xyz", 50]);
  });

  it("returns a readonly tuple", () => {
    const key = datasetsKey("project-1");
    // TypeScript should enforce readonly at compile time
    // At runtime, verify it's an array
    expect(Array.isArray(key)).toBe(true);
    expect(key.length).toBe(4);
  });

  it("generates unique keys for different projectIds", () => {
    const key1 = datasetsKey("project-1");
    const key2 = datasetsKey("project-2");
    expect(key1).not.toEqual(key2);
  });

  it("generates unique keys for different cursors", () => {
    const key1 = datasetsKey("project-1", "cursor-a");
    const key2 = datasetsKey("project-1", "cursor-b");
    expect(key1).not.toEqual(key2);
  });

  it("generates unique keys for different limits", () => {
    const key1 = datasetsKey("project-1", undefined, 10);
    const key2 = datasetsKey("project-1", undefined, 20);
    expect(key1).not.toEqual(key2);
  });
});
