import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const GET = async () => {
  const store = await cookies();
  const allCookies = store.getAll();
  const names = allCookies.map((c) => c.name);

  console.log("[logto:debug-cookies] Cookie names:", names);

  return NextResponse.json({
    cookieNames: names,
    count: names.length,
    cookies: allCookies.map((c) => ({
      name: c.name,
      hasValue: Boolean(c.value),
      valueLength: c.value?.length || 0,
    })),
  });
};
