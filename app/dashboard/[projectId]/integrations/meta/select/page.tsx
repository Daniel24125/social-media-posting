import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SelectClient from './SelectClient';

interface MetaPageData {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

export default async function MetaSelectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const cookieStore = await cookies();
  const tempToken = cookieStore.get('meta_temp_token')?.value;
  console.log("MY TOKEN:", tempToken)
  if (!tempToken) {
    redirect(`/dashboard/${projectId}/integrations?error=session_expired`);
  }

  // Fetch both personal accounts and business-assigned pages in parallel
  const [accountsRes, assignedRes] = await Promise.all([
    fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${tempToken}&fields=id,name,access_token,instagram_business_account{id,username}`),
    fetch(`https://graph.facebook.com/v19.0/me/assigned_pages?access_token=${tempToken}&fields=id,name,access_token,instagram_business_account{id,username}`)
  ]);

  const accountsJson = await accountsRes.json();
  const assignedJson = await assignedRes.json();

  // --- TRUTH SERUM LOG ---
  console.log("================ RAW META API RESPONSE ================");
  console.log("ACCOUNTS ENDPOINT:", JSON.stringify(accountsJson, null, 2));
  console.log("ASSIGNED ENDPOINT:", JSON.stringify(assignedJson, null, 2));
  console.log("=======================================================");

  // Handle fatal errors if both requests fail entirely
  if (accountsJson.error && assignedJson.error) {
    console.error('Meta API Errors:', { accounts: accountsJson.error, assigned: assignedJson.error });
    redirect(`/dashboard/${projectId}/integrations?error=meta_api_failed`);
  }

  // Merge the data arrays, filtering out any duplicate Page IDs
  const allPagesData = [...(accountsJson.data || []), ...(assignedJson.data || [])];
  const uniquePagesMap = new Map();

  allPagesData.forEach((page) => {
    if (!uniquePagesMap.has(page.id)) {
      uniquePagesMap.set(page.id, page);
    }
  });

  const pagesData: MetaPageData[] = Array.from(uniquePagesMap.values());

  const facebookPages = pagesData.map(p => ({
    id: p.id,
    name: p.name,
    accessToken: p.access_token
  }));

  const instagramAccounts = pagesData
    .filter(p => p.instagram_business_account)
    .map(p => ({
      id: p.instagram_business_account!.id,
      name: p.name,
      username: p.instagram_business_account!.username,
      accessToken: p.access_token // Instagram uses the parent Page Access Token to publish via Graph API
    }));

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2">Link Meta Channels</h1>
      <p className="text-gray-500 mb-8">Select the Facebook Pages and Instagram Professional accounts you want to manage in this workspace.</p>

      <SelectClient facebookPages={facebookPages} instagramAccounts={instagramAccounts} projectId={projectId} />
    </div>
  );
}
