export const DATA_MODE =
  process.env.NEXT_PUBLIC_DATA_MODE === "live" ||
  process.env.NEXT_PUBLIC_DATA_MODE === "api"
    ? "live"
    : "mock";
export const IS_MOCK = DATA_MODE === "mock";
