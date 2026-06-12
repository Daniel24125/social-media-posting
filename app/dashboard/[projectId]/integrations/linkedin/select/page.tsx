import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { saveLinkedinPage } from '@/app/actions/integrations';

export default async function LinkedinSelectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('linkedin_temp_token')?.value;

  if (!token) {
    redirect(`/dashboard/${projectId}/integrations`);
  }

  // In a real application, you would use the token to fetch the managed organizations:
  // const aclsResponse = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee', {
  //   headers: { Authorization: `Bearer ${token}` }
  // });
  // const aclsData = await aclsResponse.json();
  // ... map and fetch organization details

  // For this scaffold, we'll mock the response
  const managedPages = [
    { id: 'urn:li:organization:12345', name: 'SUNRISE Research Group' },
    { id: 'urn:li:organization:67890', name: 'Tech Innovators Inc.' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Select LinkedIn Page</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Choose which managed organization page you want to connect to this workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {managedPages.map(page => (
          <Card key={page.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{page.name}</CardTitle>
              <CardDescription>ID: {page.id}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-sm text-gray-500">
                You have administrative access to this page.
              </div>
            </CardContent>
            <CardFooter>
              <form action={async () => {
                'use server';
                await saveLinkedinPage(projectId, page.id, page.name);
                redirect(`/dashboard/${projectId}/integrations`);
              }} className="w-full">
                <Button variant="default" className="w-full" type="submit">
                  Connect {page.name}
                </Button>
              </form>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
