import { Suspense } from "react";
import { HomePageClient } from "@/components/home-page-client";

export default function HomePage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading dashboard...</div>}
    >
      <HomePageClient />
    </Suspense>
  );
}
