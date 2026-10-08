export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  credits?: number;
  createdAt: string;
}

export interface Image {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  aspectRatio: string;
  style: string;
  createdAt: string;
  projectId?: string;
}

export interface Video {
  id: string;
  url: string;
  thumbnailUrl: string;
  prompt: string;
  duration: number; // in seconds
  createdAt: string;
  projectId?: string;
}

export interface Caption {
  id: string;
  text: string;
  tone: string;
  platform: string;
  createdAt: string;
}

export interface Hashtag {
  id: string;
  tag: string;
  volume?: number;
  category: string;
}

export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface Analytics {
  month: string;
  images: number;
  videos: number;
  posts: number;
  reach: number;
  likes: number;
  shares: number;
  comments: number;
  followers: number;
}

export interface Credit {
  total: number;
  used: number;
  remaining: number;
  resetAt: string;
}

export interface SocialAccount {
  id: string;
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'Twitter' | 'TikTok' | 'YouTube' | 'Pinterest' | 'Threads';
  handle: string;
  followerCount: number;
  isConnected: boolean;
  profileUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  updatedAt: string;
  createdAt: string;
}

export interface ScheduledPost {
  id: string;
  postId: string;
  platform: string;
  scheduledTime: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  user: User;
  role: Role;
  joinedAt: string;
}
