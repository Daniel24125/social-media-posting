'use client';

import { useState } from 'react';
import { addTeamMember } from '@/app/actions/settings';

export default function SettingsClient({
  projectId,
  members,
}: {
  projectId: string;
  members: any[];
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invite Team Member</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Invite colleagues to collaborate in this workspace. They must have an existing account.
          </p>
        </div>
        
        <form onSubmit={handleAddMember} className="p-6">
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
            <div className="flex-1">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="colleague@example.com"
                className="w-full rounded-lg border-gray-300 dark:border-zinc-700 shadow-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Workspace Members</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            People who have access to this workspace.
          </p>
        </div>
        
        <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
          {members.map((member) => (
            <li key={member.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                  {member.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{member.user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                member.role === 'OWNER' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {member.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
