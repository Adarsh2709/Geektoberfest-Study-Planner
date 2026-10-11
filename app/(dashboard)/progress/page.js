import { getAuthUser } from "@/lib/auth";
import { getProgressData } from "@/lib/dashboard";
import { getUserTopics } from "@/lib/queries";
import { ProgressCharts } from "@/components/progress/ProgressCharts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const user = await getAuthUser();
  const [data, topics] = await Promise.all([
    getProgressData(String(user._id)),
    getUserTopics(String(user._id)),
  ]);
  return <ProgressCharts data={data} topics={topics} />;
}
