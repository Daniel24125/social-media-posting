'use client';

import { getAuthorizeUrl } from '@/app/actions/oauth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ConnectButtonProps {
  platformId: string;
  projectId: string;
  platformName: string;
  authPath: string;
}

export function ConnectButton({ projectId, platformName, authPath }: ConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // We explicitly take the type parameter to satisfy the connection routing
  const handleConnect = async (type: 'personal' | 'page' | string) => {
    setIsLoading(true);
    
    // Map the type back to the expected authPath for the universal server action
    let targetAuthPath = authPath;
    if (type === 'personal') targetAuthPath = 'linkedin-personal';
    if (type === 'page') targetAuthPath = 'linkedin-page';

    const result = await getAuthorizeUrl(targetAuthPath, projectId);

    if (result.error) {
      toast.error('Configuration Error: ' + result.error);
      setIsLoading(false);
      return;
    }

    if (result.url) {
      window.location.href = result.url;
    }
  };

  // Dynamically determine what type to pass to handleConnect based on the authPath
  const connectType = authPath === 'linkedin-personal' ? 'personal' : authPath === 'linkedin-page' ? 'page' : authPath;

  return (
    <Button 
      variant="default" 
      className="w-full" 
      onClick={() => handleConnect(connectType)}
      disabled={isLoading}
    >
      {isLoading ? 'Connecting...' : `Connect ${platformName}`}
    </Button>
  );
}
