'use client';

import { useState } from 'react';
import { addTeamMember } from '@/app/actions/settings';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FormContainer } from "@/components/shared/FormContainer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SettingsClient({
  projectId,
  members,
}: {
  projectId: string;
  members: { id: string; role: string; user: { name: string | null; email: string; } }[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    try {
      await addTeamMember(projectId, formData);
      setSuccess('Team member added successfully!');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <FormContainer
        title="Invite Team Member"
        description="Invite colleagues to collaborate in this workspace. They must have an existing account."
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 dark:bg-red-900/30 dark:border-red-900 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 text-green-600 p-4 rounded-lg text-sm border border-green-100 dark:bg-green-900/30 dark:border-green-900 dark:text-green-400">
              {success}
            </div>
          )}

          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                type="email"
                id="email"
                name="email"
                required
                placeholder="colleague@example.com"
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Inviting...' : 'Invite'}
            </Button>
          </div>
        </form>
      </FormContainer>

      <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm">
        <CardHeader className="border-b border-gray-100 dark:border-zinc-800 px-6 sm:px-8 py-6">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Workspace Members</CardTitle>
          <CardDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            People who have access to this workspace.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
            {members.map((member) => (
              <li key={member.id} className="p-6 sm:px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                    {member.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{member.user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</p>
                  </div>
                </div>
                <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'} className={member.role === 'OWNER' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 shadow-none border-transparent' : 'shadow-none border-transparent'}>
                  {member.role}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
