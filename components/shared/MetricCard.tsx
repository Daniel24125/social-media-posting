import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function MetricCard({ title, value, colorClass }: { title: string; value: number; colorClass: string }) {
  return (
    <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
