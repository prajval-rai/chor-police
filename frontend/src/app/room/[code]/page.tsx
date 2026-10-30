import { Suspense } from "react";
import { RoomClient } from "@/components/RoomClient";

export default function RoomPage() {
  // The room code comes from the URL at runtime, so it streams in.
  return (
    <Suspense fallback={<main className="center-page"><div className="loader" /></main>}>
      <RoomClient />
    </Suspense>
  );
}
