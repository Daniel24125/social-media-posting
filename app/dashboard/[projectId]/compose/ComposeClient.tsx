'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { createScheduledPost } from '@/app/actions/compose';
import { deleteMedia } from '@/app/actions/media';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FormContainer } from "@/components/shared/FormContainer";
import { toast } from "sonner";
import { Loader2, Trash2 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
);

export default function ComposeClient({ 
  projectId, 
  connectedPlatforms 
}: { 
  projectId: string;
  connectedPlatforms: { id: string, platform: string, profileHandle: string | null }[];
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInstant, setIsInstant] = useState(false);
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [blobPaths, setBlobPaths] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 4) {
      toast.error('You can only upload a maximum of 4 images.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      console.log("🟡 FRONTEND: Initiating Vercel Blob upload for files:", files.map(f => f.name));
      const uploadPromises = files.map(file => 
        upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload/token',
          onUploadProgress: (progressEvent) => {
            console.log(`🔵 FRONTEND PROGRESS [${file.name}]: ${progressEvent.loaded} / ${progressEvent.total} bytes (${progressEvent.percentage}%)`);
          }
        })
      );
      
      const newBlobs = await Promise.all(uploadPromises);
      console.log("🟢 FRONTEND: Upload promises resolved successfully!", newBlobs);
      setBlobUrls(newBlobs.map(b => b.url));
      setBlobPaths(newBlobs.map(b => b.pathname));
      toast.success(`${newBlobs.length} image(s) uploaded successfully`);
    } catch (err) {
      console.error("🔴 FRONTEND: Upload promise rejected!", err);
      const errorMessage = err instanceof Error ? err.message : 'There was an issue uploading your media.';
      toast.error('Upload Failed', {
        description: errorMessage,
      });
      setError(errorMessage);
    } finally {
      // CRITICAL FIX: Always release the loading lock
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async (urlToRemove: string) => {
    setDeletingUrl(urlToRemove);
    try {
      await deleteMedia(urlToRemove);
      const indexToRemove = blobUrls.indexOf(urlToRemove);
      setBlobUrls(prev => prev.filter(url => url !== urlToRemove));
      setBlobPaths(prev => prev.filter((_, idx) => idx !== indexToRemove));
      toast.success('Image removed successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove image');
    } finally {
      setDeletingUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    blobUrls.forEach(url => formData.append('imageUrls', url));
    blobPaths.forEach(path => formData.append('imageBlobPaths', path));
    formData.append('isInstant', isInstant.toString());

    try {
      await createScheduledPost(projectId, formData);
      toast.success(isInstant ? "Post published instantly!" : "Post scheduled successfully!");
      // Redirect happens in the server action
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule post';
      toast.error(errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <FormContainer
        title="Compose Post"
        description="Create and schedule a new publication across multiple platforms."
      >
        {connectedPlatforms.length === 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Platforms Connected</AlertTitle>
            <AlertDescription>
              You must connect at least one social media account before composing a post. Please visit the Integrations page to connect your accounts.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 dark:bg-red-900/30 dark:border-red-900 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Post Title</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Give your post a title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Caption / Content</Label>
            <Textarea
              id="content"
              name="content"
              required
              rows={5}
              placeholder="What's on your mind?"
            />
          </div>

          <div className="space-y-2">
            <Label>Media Attachment</Label>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uploading media...</p>
                </div>
              ) : blobUrls.length > 0 ? (
                <div className="flex flex-col items-center w-full">
                  <div className="w-full max-w-[280px] sm:max-w-sm mb-4" onClick={(e) => e.stopPropagation()}>
                    <Carousel className="w-full">
                      <CarouselContent>
                        {blobUrls.map((url, idx) => (
                          <CarouselItem key={idx}>
                            <div className="relative p-1">
                              <img src={url} alt={`Preview ${idx + 1}`} className="max-h-48 w-full object-cover rounded-lg border border-gray-200 dark:border-zinc-700" />
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={deletingUrl === url}
                                    className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-colors disabled:opacity-50"
                                  >
                                    {deletingUrl === url ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                  </button>
                                </DialogTrigger>
                                <DialogContent onClick={(e) => e.stopPropagation()}>
                                  <DialogHeader>
                                    <DialogTitle>Delete Image</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete this image? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <button type="button" className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        Cancel
                                      </button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveImage(url)}
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                      >
                                        Delete
                                      </button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {blobUrls.length > 1 && (
                        <>
                          <CarouselPrevious type="button" className="-left-4 sm:-left-12" />
                          <CarouselNext type="button" className="-right-4 sm:-right-12" />
                        </>
                      )}
                    </Carousel>
                  </div>
                  <p className="text-sm text-green-600 font-medium">Upload complete! Click above to replace or drag to add more.</p>
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
            <div className="space-y-3">
              <Label>Target Platforms</Label>
              <div className="space-y-3">
                {connectedPlatforms.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No platforms connected.</p>
                ) : (
                  connectedPlatforms.map((conn) => {
                    const platform = conn.platform;
                    const isLinkedin = platform.startsWith('LINKEDIN');
                    const Icon = isLinkedin ? LinkedinIcon : platform === 'X' ? XIcon : InstagramIcon;
                    const colorClass = isLinkedin ? 'text-blue-600' : platform === 'X' ? 'text-neutral-900 dark:text-white' : 'text-pink-600';
                    const displayName = conn.profileHandle || (platform === 'X' ? 'X (Twitter)' : platform.charAt(0) + platform.slice(1).toLowerCase());
                    const value = `${platform}:${conn.id}`;

                    return (
                      <label key={conn.id} className="flex items-center p-3 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                        <input
                          type="checkbox"
                          name="platforms"
                          value={value}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-zinc-600 dark:bg-zinc-700"
                        />
                        <Icon className={`w-5 h-5 ml-3 ${colorClass}`} />
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                          {isLinkedin ? `LinkedIn (${displayName})` : displayName}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Deployment Timing</Label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="timingType"
                    checked={!isInstant}
                    onChange={() => setIsInstant(false)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Schedule for Later</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="timingType"
                    checked={isInstant}
                    onChange={() => setIsInstant(true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Post Instantly</span>
                </label>
              </div>

              {!isInstant && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="scheduledDate" className="sr-only">
                    Deployment Date
                  </Label>
                  <Input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    required={!isInstant}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || isUploading || connectedPlatforms.length === 0}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  {isInstant ? 'Posting...' : 'Scheduling...'}
                </>
              ) : (
                isInstant ? 'Post Now' : 'Schedule Post'
              )}
            </Button>
          </div>
        </form>
      </FormContainer>
    </div>
  );
}
