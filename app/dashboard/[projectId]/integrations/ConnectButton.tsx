'use client';

import { getLinkedInAuthorizeUrl } from '@/app/actions/oauth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ConnectButtonProps {
  platformId: string;
  projectId: string;
  platformName: string;
  authPath: string;
}

export function ConnectButton({ platformId, projectId, platformName, authPath }: ConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    
    // Use the server action for LinkedIn paths
    if (authPath === 'linkedin-personal' || authPath === 'linkedin-page') {
      const type = authPath === 'linkedin-personal' ? 'personal' : 'page';
      const result = await getLinkedInAuthorizeUrl(type, projectId);

      if (result.error) {
        toast.error('Configuration Error: ' + result.error);
        setIsLoading(false);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } else {
      // Fallback for other platforms (X, Instagram) using the old redirect API
      window.location.href = `/api/auth/social/${authPath}/authorize?projectId=${projectId}`;
    }
  };

  return (
    <Button 
      variant="default" 
      className="w-full" 
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? 'Connecting...' : `Connect ${platformName}`}
    </Button>
  );
}
