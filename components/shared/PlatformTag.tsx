import { Badge } from "@/components/ui/badge";

export function PlatformTag({ platform }: { platform: string }) {
  const platformType = platform.split(':')[0].toUpperCase();
  
  let display = platformType;
  let colorClasses = "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800";

  if (platformType.startsWith('LINKEDIN')) {
    display = 'LinkedIn';
    colorClasses = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50";

  } else if (platformType === 'INSTAGRAM') {
    display = 'Instagram';
    colorClasses = "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50";
  } else {
    display = platformType.charAt(0) + platformType.slice(1).toLowerCase();
  }

  return (
    <Badge variant="secondary" className={`${colorClasses} font-normal px-2 py-0.5 rounded shadow-none border-transparent text-xs`}>
      {display}
    </Badge>
  );
}
