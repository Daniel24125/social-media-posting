import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status, error }: { status: string; error?: string | null }) {
  switch (status) {
    case 'PUBLISHED':
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 shadow-none border-transparent">Published</Badge>;
    case 'PENDING':
      return <Badge variant="default" className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-200 shadow-none border-transparent">Pending</Badge>;
    case 'PROCESSING':
      return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 shadow-none border-transparent">Processing</Badge>;
    case 'FAILED':
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200 cursor-help shadow-none border-transparent" title={error || 'Failed'}>
          Failed
        </Badge>
      );
    case 'MANUAL':
      return <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 shadow-none border-transparent">Manual</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 shadow-none border-transparent">{status}</Badge>;
  }
}
