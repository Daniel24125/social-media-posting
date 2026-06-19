import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { disconnectAccount } from '@/app/actions/integrations';
import { redirect } from 'next/navigation';
import { auth0 } from '@/lib/auth0';
import { ConnectButton } from './ConnectButton';

const platforms = [
  { id: 'LINKEDIN-PERSONAL', authPath: 'linkedin-personal', name: 'LinkedIn (Personal)', description: 'Connect to post updates to your personal LinkedIn profile.' },
  { id: 'LINKEDIN-PAGE', authPath: 'linkedin-page', name: 'LinkedIn (Company Page)', description: 'Connect to post updates to a LinkedIn organization page.' },
  { id: 'FACEBOOK', authPath: 'meta', name: 'Facebook Pages', description: 'Connect your Facebook Pages for cross-posting.' },
  { id: 'INSTAGRAM', authPath: 'meta', name: 'Instagram Professional', description: 'Connect your Instagram Professional accounts.' }
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
          const platformConnections = connections.filter(c => c.platform === platform.id);
          const isConnected = platformConnections.length > 0;

          return (
            <Card key={platform.id} className="flex flex-col h-full">
              <CardHeader>
                <CardTitle>{platform.name}</CardTitle>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="text-sm">
                      <span className="text-green-600 font-medium flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Connected Accounts
                      </span>
                    </div>
                    <div className="space-y-2">
                      {platformConnections.map(conn => (
                        <div key={conn.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                          <span className="font-medium">{conn.profileHandle || 'Unknown'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                    Not connected
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <ConnectButton 
                  platformId={platform.id} 
                  projectId={projectId} 
                  platformName={platform.name} 
                  authPath={platform.authPath} 
                />
                {isConnected && (
                  <form action={async () => {
                    'use server';
                    await disconnectAccount(projectId, platform.id);
                  }} className="w-full mt-2">
                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" type="submit">
                      Disconnect All {platform.name}
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
