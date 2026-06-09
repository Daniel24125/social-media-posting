import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function FormContainer({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm ${className}`}>
      <CardHeader className="border-b border-gray-100 dark:border-zinc-800 px-6 sm:px-8 py-6">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">{title}</CardTitle>
        {description && (
          <CardDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        {children}
      </CardContent>
    </Card>
  );
}
