'use client';

import React from 'react';
import { Users, FolderKanban, Plus, UserPlus, FileText, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockProjects } from '@/services/mock-data';

export default function WorkspacePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Workspace</h1>
          <p className="text-sm text-muted-foreground">Collaborate on AI content creation, manage team permissions, and organize brand assets.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl gap-2 text-xs">
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-semibold text-xs">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-blue-500" />
          <span>Active Team Projects</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockProjects.map((project) => (
            <Card key={project.id} className="border-border bg-card rounded-2xl p-5 hover:border-border/80 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500 bg-blue-500/10">
                  {project.status.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground">Updated {project.updatedAt}</span>
              </div>
              <h3 className="font-bold text-base text-foreground">{project.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
