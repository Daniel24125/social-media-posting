'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { createScheduledPost } from '@/app/actions/compose';

export default function ComposeClient({ projectId }: { projectId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blobPath, setBlobPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload/token',
      });
      setBlobUrl(newBlob.url);
      setBlobPath(newBlob.pathname);
    } catch (err: any) {
      console.error(err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (blobUrl) formData.append('imageUrl', blobUrl);
    if (blobPath) formData.append('imageBlobPath', blobPath);

    try {
      await createScheduledPost(projectId, formData);
      // Redirect happens in the server action
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to schedule post');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compose Post</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create and schedule a new publication across multiple platforms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 dark:bg-red-900/30 dark:border-red-900 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Caption / Content
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={5}
            placeholder="What's on your mind?"
            className="w-full rounded-lg border-gray-300 dark:border-zinc-700 shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white transition-colors"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Media Attachment
          </label>
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Uploading media...</p>
              </div>
            ) : blobUrl ? (
              <div className="flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={blobUrl} alt="Preview" className="max-h-48 rounded-lg mb-4" />
                <p className="text-sm text-green-600 font-medium">Upload complete! Click to replace.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="h-12 w-12 text-gray-400 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload an image, or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Target Platforms
            </label>
            <div className="space-y-3">
              {['LINKEDIN', 'X', 'INSTAGRAM'].map((platform) => (
                <label key={platform} className="flex items-center p-3 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                  <input
                    type="checkbox"
                    name="platforms"
                    value={platform}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-zinc-600 dark:bg-zinc-700"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                    {platform === 'X' ? 'X (Twitter)' : platform.charAt(0) + platform.slice(1).toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Deployment Date
            </label>
            <input
              type="date"
              id="scheduledDate"
              name="scheduledDate"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border-gray-300 dark:border-zinc-700 shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white transition-colors"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Scheduling...
              </>
            ) : (
              'Schedule Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
