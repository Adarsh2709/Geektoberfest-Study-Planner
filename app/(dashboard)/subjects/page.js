import { getAuthUser } from "@/lib/auth";
import { getSubjectsStats } from "@/lib/queries";
import { SubjectsView } from "@/components/subjects/SubjectsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Subjects" };

export default async function SubjectsPage() {
  const user = await getAuthUser();
  const subjects = await getSubjectsStats(String(user._id));
  return <SubjectsView subjects={subjects} />;
}
