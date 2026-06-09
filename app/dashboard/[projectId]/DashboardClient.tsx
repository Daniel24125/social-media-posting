'use client';

import { useState } from 'react';
import { createManualPost } from '@/app/actions/post';
import { format } from 'date-fns';

type Post = {
  id: string;
  content: string;
  platforms: string[];
  scheduledDate: Date;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
};

export default function DashboardClient({
  projectId,
  initialPosts,
}: {
  projectId: string;
  initialPosts: Post[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stats
  const totalScheduled = posts.filter((p) => p.status === 'PENDING').length;
  const totalPublished = posts.filter((p) => p.status === 'PUBLISHED').length;
  const totalFailed = posts.filter((p) => p.status === 'FAILED').length;
  const totalManual = posts.filter((p) => p.status === 'MANUAL').length;

  // Filter
  const filteredPosts = posts.filter((p) => {
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchPlatform =
      filterPlatform === 'ALL' || p.platforms.includes(filterPlatform);
    return matchStatus && matchPlatform;
  });

  const handleManualEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createManualPost(projectId, formData);
      setIsModalOpen(false);
      // Let standard Next.js revalidation refresh the data.
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to log manual entry');
    }
  };

  const getStatusBadge = (status: string, error?: string | null) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Published</span>;
      case 'PENDING':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Pending</span>;
      case 'PROCESSING':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Processing</span>;
      case 'FAILED':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 cursor-help" title={error || 'Failed'}>
            Failed
          </span>
        );
      case 'MANUAL':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">Manual</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Scheduled', value: totalScheduled, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Total Published', value: totalPublished, color: 'text-green-600 dark:text-green-400' },
          { label: 'Total Failed', value: totalFailed, color: 'text-red-600 dark:text-red-400' },
          { label: 'Total Manual', value: totalManual, color: 'text-slate-600 dark:text-slate-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</h3>
            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PUBLISHED">Published</option>
              <option value="FAILED">Failed</option>
              <option value="MANUAL">Manual</option>
            </select>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="text-sm border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Platforms</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="X">X (Twitter)</option>
              <option value="INSTAGRAM">Instagram</option>
            </select>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            + Log Manual Update
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
            <thead className="bg-gray-50 dark:bg-zinc-950/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platforms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white line-clamp-2 max-w-md">{post.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {post.platforms.map((p) => (
                        <span key={p} className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(post.scheduledDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(post.status, post.errorMessage)}
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No posts found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-zinc-950/80 transition-opacity" onClick={() => setIsModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-zinc-900 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100 dark:border-zinc-800">
              <form onSubmit={handleManualEntry}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                    Log Personal/Manual Update
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                      <textarea
                        id="content"
                        name="content"
                        required
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 dark:border-zinc-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        placeholder="What did you post?"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Platforms</label>
                      <div className="flex gap-4">
                        {['LINKEDIN', 'X', 'INSTAGRAM'].map((platform) => (
                          <label key={platform} className="flex items-center">
                            <input
                              type="checkbox"
                              name="platforms"
                              value={platform}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-zinc-700 dark:bg-zinc-800"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{platform === 'X' ? 'X (Twitter)' : platform.charAt(0) + platform.slice(1).toLowerCase()}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                      <input
                        type="date"
                        id="scheduledDate"
                        name="scheduledDate"
                        required
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full border border-gray-300 dark:border-zinc-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-950/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-zinc-800">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save Manual Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-zinc-700 shadow-sm px-4 py-2 bg-white dark:bg-zinc-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
