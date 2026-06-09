import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Share2, Database, Users } from "lucide-react";
import Link from "next/link";
import { auth0 } from '@/lib/auth0';

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Bar */}
      <header className="px-6 lg:px-8 h-16 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight">Social Media Scheduler</span>
        </div>
        <nav>
          {session ? (
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/auth/login">Log In / Get Started</Link>
            </Button>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 flex flex-col items-center justify-center text-center px-4 md:px-6">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Streamline Project Communications Across Every Platform
            </h1>
            <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
              The central hub to schedule, sync, and track research publications across LinkedIn, X, and Instagram.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {session ? (
              <Button asChild size="lg">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link href="/auth/login">Log In / Get Started</Link>
              </Button>
            )}
            <Button variant="outline" size="lg" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-slate-50 dark:bg-slate-900/50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              {/* Feature 1 */}
              <Card>
                <CardHeader>
                  <Share2 className="w-10 h-10 mb-4 text-primary" />
                  <CardTitle>Multi-Platform Sync</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Write once, publish everywhere. Connect LinkedIn, X, and Instagram through automated webhooks.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card>
                <CardHeader>
                  <Database className="w-10 h-10 mb-4 text-primary" />
                  <CardTitle>Permanent Track Record</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Never lose a post. Every scheduled publication and manual entry is archived in a centralized database.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card>
                <CardHeader>
                  <Users className="w-10 h-10 mb-4 text-primary" />
                  <CardTitle>Team Collaboration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Invite researchers to your workspace. Share access without sharing social media passwords.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
