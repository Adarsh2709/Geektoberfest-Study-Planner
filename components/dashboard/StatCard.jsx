import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ icon: Icon, label, value, sub, iconClassName }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">{label}</p>
          {Icon ? <Icon className={cn("h-4 w-4 text-indigo-500", iconClassName)} /> : null}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        {sub ? <p className="mt-0.5 text-xs text-zinc-400">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}
