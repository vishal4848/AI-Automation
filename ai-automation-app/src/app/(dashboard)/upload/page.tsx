'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Image as ImageIcon,
  Video,
  FileCheck,
  Calendar,
  Library,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FolderKanban,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export default function UploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [uploadedAsset, setUploadedAsset] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch real workspace projects for optional project tagging
  const { data: projectsData } = useQuery({
    queryKey: ['workspace-projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) return [];
      const json = await res.json();
      return json.projects || json.data?.projects || [];
    },
    staleTime: 5000,
  });

  const projects: any[] = Array.isArray(projectsData) ? projectsData : [];

  const validateAndSetFile = (file: File) => {
    setErrorMessage('');
    const mime = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    const isImage =
      ALLOWED_IMAGE_TYPES.includes(mime) || /\.(jpe?g|png|webp)$/i.test(name);
    const isVideo =
      ALLOWED_VIDEO_TYPES.includes(mime) || /\.(mp4|mov|webm)$/i.test(name);

    if (!isImage && !isVideo) {
      setErrorMessage(
        'UNSUPPORTED_FILE_TYPE: Only JPG, PNG, WEBP images and MP4, MOV, WEBM videos are supported.',
      );
      return false;
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      setErrorMessage(
        `FILE_TOO_LARGE: Image size (${(file.size / (1024 * 1024)).toFixed(
          1,
        )}MB) exceeds the maximum limit of 10MB.`,
      );
      return false;
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      setErrorMessage(
        `FILE_TOO_LARGE: Video size (${(file.size / (1024 * 1024)).toFixed(
          1,
        )}MB) exceeds the maximum limit of 100MB.`,
      );
      return false;
    }

    setSelectedFile(file);

    // Create local object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    setUploadedAsset(null);
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrorMessage('');
    setUploadedAsset(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMessage('');
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (selectedProjectId) {
      formData.append('projectId', selectedProjectId);
    }

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 300);

      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || 'Upload failed.');
      }

      const asset = data.data || data;
      setUploadedAsset(asset);

      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ['content-library-images'] });
      queryClient.invalidateQueries({ queryKey: ['content-library-assets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      setNotification({
        type: 'success',
        text: `"${selectedFile.name}" uploaded successfully!`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload file to backend storage.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteUploadedAsset = async () => {
    if (!uploadedAsset || isDeleting) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/assets/${uploadedAsset.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok && data.success === false) {
        throw new Error(
          data.error ||
            'This media is currently being used by a scheduled post and cannot be deleted.',
        );
      }

      queryClient.invalidateQueries({ queryKey: ['content-library-images'] });
      queryClient.invalidateQueries({ queryKey: ['content-library-assets'] });

      setNotification({ type: 'success', text: 'Asset deleted permanently.' });
      handleRemoveSelectedFile();
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to delete asset.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSchedulePost = () => {
    if (!uploadedAsset) return;
    const mediaUrl = uploadedAsset.secureUrl || uploadedAsset.url;
    const caption = uploadedAsset.fileName || 'Uploaded Media';
    router.push(
      `/scheduler?mediaUrl=${encodeURIComponent(mediaUrl)}&caption=${encodeURIComponent(
        caption,
      )}&autoOpen=true`,
    );
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const isVideo =
    selectedFile?.type.startsWith('video/') ||
    uploadedAsset?.resourceType === 'video' ||
    /\.(mp4|mov|webm)$/i.test(selectedFile?.name || '');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-8 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-950/90 text-rose-300 border-rose-500/30'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span className="text-sm font-medium">{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-400 mb-2">
            <Upload className="w-3.5 h-3.5" /> Media Storage & Scheduling
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Upload from Device
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your own media and schedule it to your connected social accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/content-library"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground text-xs font-semibold hover:bg-white/10 transition-all"
          >
            <Library className="w-4 h-4" />
            <span>Content Library</span>
          </Link>
        </div>
      </div>

      {/* Main Upload / Preview Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Upload Dropzone & Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="glass-card border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden">
            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!selectedFile ? (
              /* Dropzone Area */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99]'
                    : 'border-white/15 hover:border-primary/60 hover:bg-white/[0.02]'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Upload className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    Upload your media
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Drag & drop your file here, or{' '}
                    <span className="text-primary font-semibold underline">
                      Browse Files
                    </span>
                  </p>
                </div>

                {/* Formats Pills */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                  <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                    JPG
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                    PNG
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                    WEBP
                  </Badge>
                  <span className="text-muted-foreground text-xs mx-1">•</span>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                    MP4
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                    MOV
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                    WEBM
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground/70">
                  Images up to 10MB • Videos up to 100MB
                </p>
              </div>
            ) : (
              /* Selected File Details & Upload Action */
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                      {isVideo ? <Video className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatBytes(selectedFile.size)} • {selectedFile.type || 'Media'}
                      </p>
                    </div>
                  </div>

                  {!uploadedAsset && !isUploading && (
                    <button
                      onClick={handleRemoveSelectedFile}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Optional Project Assignment */}
                {projects.length > 0 && !uploadedAsset && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
                      <span>Save to Workspace Project (Optional)</span>
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      disabled={isUploading}
                      className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">No specific project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          📁 {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span>Uploading to Cloudinary...</span>
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {!uploadedAsset && (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={handleRemoveSelectedFile}
                      className="flex-1 rounded-xl text-xs border-border"
                    >
                      Replace File
                    </Button>
                    <Button
                      type="button"
                      disabled={isUploading}
                      onClick={handleUpload}
                      className="flex-1 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Upload Now</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Preview & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="glass-card border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Media Preview & Actions</span>
            </h3>

            {filePreview ? (
              <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center group">
                  {isVideo ? (
                    <video
                      src={filePreview}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={filePreview}
                      alt="Upload Preview"
                      className="w-full h-full object-contain"
                    />
                  )}

                  {uploadedAsset && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-emerald-500/90 text-white text-[10px] font-bold shadow-md flex items-center gap-1 border-none">
                        <CheckCircle2 className="w-3 h-3" /> Uploaded to Cloudinary
                      </Badge>
                    </div>
                  )}
                </div>

                {uploadedAsset && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Source</span>
                      <span className="font-semibold text-cyan-400">Device Upload</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Storage</span>
                      <span className="font-semibold text-foreground">Cloudinary HTTPS</span>
                    </div>
                    {uploadedAsset.width && uploadedAsset.height && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Dimensions</span>
                        <span className="font-semibold text-foreground">
                          {uploadedAsset.width} × {uploadedAsset.height}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Post-Upload Actions */}
                {uploadedAsset && (
                  <div className="space-y-2.5 pt-2">
                    <Button
                      onClick={handleSchedulePost}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 py-5"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Schedule Post</span>
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/content-library')}
                        className="rounded-xl text-xs border-white/10 flex items-center justify-center gap-1.5"
                      >
                        <Library className="w-3.5 h-3.5" />
                        <span>View Library</span>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleRemoveSelectedFile}
                        className="rounded-xl text-xs border-white/10 flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Another</span>
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      disabled={isDeleting}
                      onClick={handleDeleteUploadedAsset}
                      className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl flex items-center justify-center gap-1.5 py-2 mt-1"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Delete Uploaded Asset</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square w-full rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground bg-white/[0.01]">
                <FileCheck className="w-10 h-10 opacity-30" />
                <p className="text-xs font-medium">No media selected yet</p>
                <p className="text-[11px] opacity-70">
                  Select or drag a file to preview and schedule it across your social accounts.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
