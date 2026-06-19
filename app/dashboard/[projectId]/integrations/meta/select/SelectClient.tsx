'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { saveMetaAccounts } from '@/app/actions/meta';

interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
}

interface InstagramAccount {
  id: string;
  name: string;
  username: string;
  accessToken: string;
}

interface SelectClientProps {
  facebookPages: FacebookPage[];
  instagramAccounts: InstagramAccount[];
  projectId: string;
}

export default function SelectClient({ facebookPages, instagramAccounts, projectId }: SelectClientProps) {
  const router = useRouter();
  const [selectedFb, setSelectedFb] = useState<Set<string>>(new Set());
  const [selectedIg, setSelectedIg] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFb = (id: string) => {
    const next = new Set(selectedFb);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFb(next);
  };

  const toggleIg = (id: string) => {
    const next = new Set(selectedIg);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIg(next);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    const accountsToSave = [
      ...facebookPages.filter(p => selectedFb.has(p.id)).map(p => ({
        id: p.id,
        name: p.name,
        type: 'FACEBOOK' as const,
        accessToken: p.accessToken,
      })),
      ...instagramAccounts.filter(a => selectedIg.has(a.id)).map(a => ({
        id: a.id,
        name: a.name,
        type: 'INSTAGRAM' as const,
        accessToken: a.accessToken,
        username: a.username,
      })),
    ];

    if (accountsToSave.length === 0) {
      router.push(`/dashboard/${projectId}/integrations`);
      return;
    }

    const result = await saveMetaAccounts(projectId, accountsToSave);
    
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push(`/dashboard/${projectId}/integrations`);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 text-sm text-red-800 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {instagramAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Instagram Professional Accounts</h2>
          <div className="grid gap-4">
            {instagramAccounts.map((account) => (
              <Card 
                key={account.id} 
                className={`cursor-pointer transition-colors ${selectedIg.has(account.id) ? 'border-blue-500 bg-blue-50/50' : 'hover:bg-gray-50'}`}
                onClick={() => toggleIg(account.id)}
              >
                <CardContent className="flex items-center justify-between p-4 pb-4">
                  <div>
                    <p className="font-medium">@{account.username}</p>
                    <p className="text-sm text-gray-500">via {account.name}</p>
                  </div>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedIg.has(account.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                    {selectedIg.has(account.id) && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {facebookPages.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Facebook Pages</h2>
          <div className="grid gap-4">
            {facebookPages.map((page) => (
              <Card 
                key={page.id} 
                className={`cursor-pointer transition-colors ${selectedFb.has(page.id) ? 'border-blue-500 bg-blue-50/50' : 'hover:bg-gray-50'}`}
                onClick={() => toggleFb(page.id)}
              >
                <CardContent className="flex items-center justify-between p-4 pb-4">
                  <p className="font-medium">{page.name}</p>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedFb.has(page.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                    {selectedFb.has(page.id) && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(facebookPages.length === 0 && instagramAccounts.length === 0) && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          No Facebook Pages or Instagram Professional accounts found.
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button variant="outline" onClick={() => router.push(`/dashboard/${projectId}/integrations`)} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Connect Selected Accounts'}
        </Button>
      </div>
    </div>
  );
}
