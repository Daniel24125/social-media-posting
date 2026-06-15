'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createManualPost, deleteScheduledPost } from '@/app/actions/post';
import { Trash2, Download, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PlatformTag } from "@/components/shared/PlatformTag";

type Post = {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async (postId: string) => {
    setDeletingPostId(postId);
    startTransition(async () => {
      try {
        await deleteScheduledPost(postId, projectId);
        setPosts((currentPosts) => currentPosts.filter((p) => p.id !== postId));
        toast.success("Post deleted successfully");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete post');
      } finally {
        setDeletingPostId(null);
      }
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SUNRISE_Outreach_Tracking_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export successful");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

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
    setIsSubmittingManual(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createManualPost(projectId, formData);
      setIsModalOpen(false);
      toast.success("Manual entry logged successfully!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log manual entry');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Scheduled" value={totalScheduled} colorClass="text-amber-600 dark:text-amber-400" />
        <MetricCard title="Total Published" value={totalPublished} colorClass="text-green-600 dark:text-green-400" />
        <MetricCard title="Total Failed" value={totalFailed} colorClass="text-red-600 dark:text-red-400" />
        <MetricCard title="Total Manual" value={totalManual} colorClass="text-slate-600 dark:text-slate-400" />
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Platforms</SelectItem>
                <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                <SelectItem value="X">X (Twitter)</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export to Excel
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>+ Log Manual Update</Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Log Personal/Manual Update</DialogTitle>
                <DialogDescription>
                  Keep track of updates you posted manually.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleManualEntry} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Post Title</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    placeholder="Enter post title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postLink">Post Link / URL (Optional)</Label>
                  <Input
                    id="postLink"
                    name="postLink"
                    type="url"
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    required
                    rows={3}
                    placeholder="What did you post?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Target Platforms</Label>
                  <div className="flex gap-4">
                    {['LINKEDIN', 'X', 'INSTAGRAM'].map((platform) => (
                      <label key={platform} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="platforms"
                          value={platform}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-zinc-700 dark:bg-zinc-800"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{platform === 'X' ? 'X (Twitter)' : platform.charAt(0) + platform.slice(1).toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date</Label>
                  <Input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <DialogFooter className="mt-6">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingManual}>
                    {isSubmittingManual && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Manual Entry
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow 
                  key={post.id} 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                  onClick={() => setSelectedPost(post)}
                >
                  <TableCell className="max-w-md">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{post.title}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {post.platforms.map((p) => (
                        <PlatformTag key={p} platform={p} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {format(new Date(post.scheduledDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={post.status} error={post.errorMessage} />
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          disabled={deletingPostId === post.id || isPending && deletingPostId !== null}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          title="Delete Post"
                        >
                          {deletingPostId === post.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Post</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
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
                              onClick={() => handleDelete(post.id)}
                              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Delete
                            </button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPosts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No posts found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!errorDialogMessage} onOpenChange={(open) => !open && setErrorDialogMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription className="text-red-600 dark:text-red-400">
              {errorDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                OK
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Details Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>
              Scheduled for {selectedPost && format(new Date(selectedPost.scheduledDate), 'MMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-6">
              {selectedPost.imageUrls && selectedPost.imageUrls.length > 0 && (
                <div className="flex justify-center bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 border border-gray-100 dark:border-zinc-800">
                  {selectedPost.imageUrls.length === 1 ? (
                    <img src={selectedPost.imageUrls[0]} alt="Post media" className="max-h-64 object-contain rounded-md" />
                  ) : (
                    <Carousel className="w-full max-w-sm">
                      <CarouselContent>
                        {selectedPost.imageUrls.map((url, idx) => (
                          <CarouselItem key={idx}>
                            <div className="p-1">
                              <img src={url} alt={`Post media ${idx + 1}`} className="max-h-64 w-full object-contain rounded-md" />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  )}
                </div>
              )}
              
              <div className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-lg border border-gray-100 dark:border-zinc-800">
                <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{selectedPost.content}</p>
              </div>

              <div className="flex gap-2">
                {selectedPost.platforms.map(p => <PlatformTag key={p} platform={p} />)}
                <StatusBadge status={selectedPost.status} error={selectedPost.errorMessage} />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex justify-between sm:justify-between w-full">
            <div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    disabled={deletingPostId === selectedPost?.id}
                  >
                    {deletingPostId === selectedPost?.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Post</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this post? This action cannot be undone.
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
                        onClick={() => {
                          if (selectedPost) {
                            handleDelete(selectedPost.id);
                            setSelectedPost(null);
                          }
                        }}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setSelectedPost(null)}>
                Close
              </Button>
              <Button type="button" onClick={() => alert("Edit functionality coming soon")}>
                Edit
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
