import { createFirstWorkspace } from './actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-zinc-900 shadow-lg border-gray-100 dark:border-zinc-800">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome!</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Let's get started by creating your first project workspace.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form action={createFirstWorkspace} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Workspace Name
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g. SUNRISE"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              size="lg"
            >
              Create Workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
