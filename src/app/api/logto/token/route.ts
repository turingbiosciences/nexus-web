import { NextResponse } from "next/server";

export const GET = async () => {
  console.log("[logto:token] M2M token request received");
  console.log("[logto:token] Config:", {
    endpoint: process.env.LOGTO_ENDPOINT,
    m2mAppId: process.env.LOGTO_M2M_APP_ID,
    resource: process.env.LOGTO_M2M_ENDPOINT,
  });

  try {
    // Fetch M2M token from Logto
    const tokenResponse = await fetch(
      `${process.env.LOGTO_ENDPOINT}/oidc/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.LOGTO_M2M_APP_ID!,
          client_secret: process.env.LOGTO_M2M_APP_SECRET!,
          resource: process.env.LOGTO_M2M_ENDPOINT!,
          scope: "all",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[logto:token] Token fetch failed:", errorText);
      throw new Error(
        `Token fetch failed: ${tokenResponse.status} - ${errorText}`
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    console.log("[logto:token] ✅ M2M token obtained successfully");

    // Decode the JWT to inspect claims (just for debugging)
    if (process.env.NEXT_PUBLIC_TBIO_DEBUG === "true") {
      try {
        const [, payload] = tokenData.access_token.split(".");
        const decodedPayload = JSON.parse(
          Buffer.from(payload, "base64url").toString()
        );
        console.log("[logto:token] Token claims:", {
          aud: decodedPayload.aud,
          scope: decodedPayload.scope,
          iss: decodedPayload.iss,
          exp: new Date(decodedPayload.exp * 1000).toISOString(),
        });
      } catch {
        console.log("[logto:token] Could not decode token for debugging");
      }
    }

    return NextResponse.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    });
  } catch (error) {
    console.error("[logto:token] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
