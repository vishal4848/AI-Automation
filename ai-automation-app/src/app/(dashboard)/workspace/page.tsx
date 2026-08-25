'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  FolderKanban, 
  Plus, 
  UserPlus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Loader2, 
  X, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Calendar,
  Eye,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function WorkspacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load active project ID from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_automation_active_project_id');
    if (saved) {
      setActiveProjectId(saved);
    }
  }, []);

  // Fetch real projects from PostgreSQL database
  const { data: projectsData, isLoading: isLoadingProjects, isError: isErrorProjects, refetch: refetchProjects } = useQuery({
    queryKey: ['workspace-projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }
      const json = await res.json();
      return json.projects || [];
    },
    staleTime: 5000,
  });

  const projects: any[] = Array.isArray(projectsData) ? projectsData : [];

  // Update active project if previous was deleted or none selected
  useEffect(() => {
    if (projects.length > 0) {
      const exists = projects.some((p) => p.id === activeProjectId);
      if (!exists || !activeProjectId) {
        const firstId = projects[0].id;
        setActiveProjectId(firstId);
        localStorage.setItem('ai_automation_active_project_id', firstId);
      }
    } else {
      setActiveProjectId(null);
      localStorage.removeItem('ai_automation_active_project_id');
    }
  }, [projects, activeProjectId]);

  // Fetch images belonging to the active project
  const { data: projectImagesData, isLoading: isLoadingImages } = useQuery({
    queryKey: ['workspace-project-images', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const res = await fetch(`/api/images?projectId=${activeProjectId}&limit=50`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.images || json.data?.images || [];
    },
    enabled: Boolean(activeProjectId),
    staleTime: 5000,
  });

  const projectImages: any[] = Array.isArray(projectImagesData) ? projectImagesData : [];
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    localStorage.setItem('ai_automation_active_project_id', projectId);
    setNotification({ type: 'success', text: 'Active workspace project updated.' });
    setTimeout(() => setNotification(null), 3000);
  };

  // Create Project Mutation
  const createMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }
      return data;
    },
    onSuccess: (newProj) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-projects'] });
      setActiveProjectId(newProj.id);
      localStorage.setItem('ai_automation_active_project_id', newProj.id);
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setFormError('');
      setNotification({ type: 'success', text: `Project "${newProj.name}" created successfully!` });
      setTimeout(() => setNotification(null), 3500);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create project');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed) {
      setFormError('Project name is required.');
      return;
    }
    setFormError('');
    createMutation.mutate({
      name: trimmed,
      description: newProjectDescription.trim() || undefined,
    });
  };

  // Delete Project Handler
  const handleConfirmDelete = async () => {
    if (!projectToDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to delete project');
      }

      queryClient.setQueryData(['workspace-projects'], (old: any[]) => {
        if (!Array.isArray(old)) return [];
        return old.filter((p) => p.id !== projectToDelete.id);
      });
      queryClient.invalidateQueries({ queryKey: ['workspace-project-images'] });

      setProjectToDelete(null);
      setNotification({ type: 'success', text: 'Project permanently deleted.' });
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Failed to delete project.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'Recently';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 min-h-[calc(100vh-8rem)] flex flex-col">
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
            {notification.type === 'success' ? <Check className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span className="text-sm font-medium">{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Team Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize brand projects, store generated assets, and collaborate with your AI workflow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl gap-2 text-xs border-border hover:bg-secondary">
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </Button>
          <Button 
            onClick={() => {
              setIsCreateModalOpen(true);
              setFormError('');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-semibold text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-500" />
            <span>Workspace Projects</span>
            {projects.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                {projects.length}
              </span>
            )}
          </h2>
        </div>

        {/* Loading Skeleton */}
        {isLoadingProjects && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-secondary/30 border border-border/40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {isErrorProjects && (
          <div className="p-8 text-center border border-border rounded-2xl bg-card/30 space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-sm font-semibold text-foreground">Failed to load workspace projects</p>
            <Button variant="outline" size="sm" onClick={() => refetchProjects()} className="rounded-xl text-xs">
              Retry
            </Button>
          </div>
        )}

        {/* Empty Workspace State */}
        {!isLoadingProjects && !isErrorProjects && projects.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border/60 bg-card/20 my-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
              <FolderKanban className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No projects yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              Create your first project to start generating content and organizing your AI assets.
            </p>
            <Button
              onClick={() => {
                setIsCreateModalOpen(true);
                setFormError('');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-semibold text-sm shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </Button>
          </div>
        )}

        {/* Real Projects Grid */}
        {!isLoadingProjects && !isErrorProjects && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((project) => {
              const isActive = project.id === activeProjectId;

              return (
                <Card 
                  key={project.id} 
                  onClick={() => handleSelectProject(project.id)}
                  className={`relative border rounded-2xl p-5 transition-all shadow-sm cursor-pointer group ${
                    isActive 
                      ? 'border-blue-500/80 bg-blue-500/[0.04] ring-1 ring-blue-500/30' 
                      : 'border-border bg-card hover:border-border/80 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500 bg-blue-500/10 uppercase">
                        {project.status || 'ACTIVE'}
                      </Badge>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Updated {formatDate(project.updatedAt)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-foreground group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Project Assets & Generated Images Section */}
      {activeProject && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-bold text-foreground">
                  Assets in <span className="text-blue-400">"{activeProject.name}"</span>
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                  {projectImages.length} images
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Images stored directly in this workspace project.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/ai-image"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate in this Project</span>
              </Link>
              <Link
                href="/content-library"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-secondary transition-all"
              >
                <span>View in Content Library</span>
              </Link>
            </div>
          </div>

          {/* Project Images Gallery */}
          {isLoadingImages ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-secondary/30 animate-pulse border border-border/40" />
              ))}
            </div>
          ) : projectImages.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 bg-card/20 space-y-3">
              <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm font-semibold text-foreground">No images stored in this project yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Generate images in Image Studio with this project selected to store them here automatically.
              </p>
              <Link
                href="/ai-image"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create First Image</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {projectImages.map((img) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-secondary/30 border border-border hover:border-primary/50 transition-all shadow-sm"
                >
                  <img
                    src={img.url}
                    alt={img.prompt || 'Project Image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                    <span className="text-[10px] text-white/90 line-clamp-2">{img.prompt}</span>
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => router.push(`/scheduler?mediaUrl=${encodeURIComponent(img.url)}&caption=${encodeURIComponent(img.prompt || '')}&autoOpen=true`)}
                        className="p-1.5 bg-white/20 hover:bg-cyan-500 text-white rounded-lg transition-colors"
                        title="Schedule"
                      >
                        <Calendar size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Create New Project</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Project Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Q3 Brand Social Campaign"
                    className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Briefly describe the assets and goals for this project..."
                    className="w-full px-3.5 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={createMutation.isPending}
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-xl text-xs border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>{createMutation.isPending ? 'Creating...' : 'Create Project'}</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-destructive">
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Delete Project?</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Are you sure you want to permanently delete <strong className="text-foreground">"{projectToDelete.name}"</strong>?
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isDeleting}
                  onClick={() => setProjectToDelete(null)}
                  className="rounded-xl text-xs border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>{isDeleting ? 'Deleting...' : 'Delete Project'}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
