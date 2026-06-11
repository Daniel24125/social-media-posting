import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { disconnectAccount } from '@/app/actions/integrations';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';

const platforms = [
  { id: 'LINKEDIN', name: 'LinkedIn', description: 'Connect to post updates to your LinkedIn profile or company page.' },
  { id: 'X', name: 'X (Twitter)', description: 'Connect to post tweets to your X account.' },
  { id: 'INSTAGRAM', name: 'Instagram', description: 'Connect to post images to your Instagram account.' }
];

export default async function IntegrationsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth0.getSession();
  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const connections = await prisma.connectedAccount.findMany({
    where: { projectId }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Connect your social media accounts to enable direct posting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map(platform => {
          const connection = connections.find(c => c.platform === platform.id);
          const isConnected = !!connection;

          return (
            <Card key={platform.id}>
              <CardHeader>
                <CardTitle>{platform.name}</CardTitle>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="text-sm">
                    <span className="text-green-600 font-medium flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      Connected
                    </span>
                    {connection.profileHandle && (
                      <p className="mt-2 text-gray-700 dark:text-gray-300">
                        As: <strong>{connection.profileHandle}</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                    Not connected
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {isConnected ? (
                  <form action={async () => {
                    'use server';
                    await disconnectAccount(projectId, platform.id);
                  }} className="w-full">
                    <Button variant="destructive" className="w-full" type="submit">
                      Disconnect
                    </Button>
                  </form>
                ) : (
                  <form action={async () => {
                    'use server';
                    redirect(`/api/auth/social/${platform.id.toLowerCase()}/authorize?projectId=${projectId}`);
                  }} className="w-full">
                    <Button variant="default" className="w-full" type="submit">
                      Connect {platform.name}
                    </Button>
                  </form>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
