import { getAuthenticatedUserOrThrow } from "@/lib/auth";
import HikeTrackerUI from "@/components/HikeTrackerUI";

export const metadata = {
  title: "BAD Hiking Group Tracker",
  description: "Upload photos and track hiker attendance",
};

export default async function HikeTrackerPage() {
  // Protect page - only authenticated users can access
  const user = await getAuthenticatedUserOrThrow();

  return (
    <main>
      <HikeTrackerUI />
    </main>
  );
}
