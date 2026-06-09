import { Badge } from "@/components/ui/badge";

export function PlatformTag({ platform }: { platform: string }) {
  const display = platform === 'X' ? 'X (Twitter)' : platform.charAt(0) + platform.slice(1).toLowerCase();
  return (
    <Badge variant="secondary" className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 font-normal px-2 py-0.5 rounded shadow-none border-transparent text-xs">
      {display}
    </Badge>
  );
}
