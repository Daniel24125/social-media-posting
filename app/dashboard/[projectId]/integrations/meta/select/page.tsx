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

  if (!tempToken) {
    redirect(`/dashboard/${projectId}/integrations?error=session_expired`);
  }

  // Fetch Facebook Pages and nested Instagram Business Accounts in a single query
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${tempToken}&fields=id,name,access_token,instagram_business_account{id,username}`
  );

  if (!res.ok) {
    console.error('Failed to fetch Meta options:', await res.text());
    redirect(`/dashboard/${projectId}/integrations?error=meta_api_failed`);
  }

  const json = await res.json();

  // --- TRUTH SERUM LOG ---
  console.log("================ RAW META API RESPONSE ================");
  console.log(JSON.stringify(json, null, 2));
  console.log("=======================================================");

  if (json.error) {
    console.error('Meta API Error Payload:', json.error);
  }

  const pagesData: MetaPageData[] = json.data || [];

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
