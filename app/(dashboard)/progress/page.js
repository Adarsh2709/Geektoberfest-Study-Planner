import { getAuthUser } from "@/lib/auth";
import { getProgressData } from "@/lib/dashboard";
import { ProgressCharts } from "@/components/progress/ProgressCharts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const user = await getAuthUser();
  const data = await getProgressData(String(user._id));
  return <ProgressCharts data={data} />;
}
