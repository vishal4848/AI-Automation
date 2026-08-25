import { Analytics, Caption, Hashtag, Image, Notification, Post, Project, ScheduledPost, SocialAccount, User, Video, WorkspaceMember } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Alice Smith', email: 'alice@example.com', role: 'admin', createdAt: '2023-01-15T10:00:00Z', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 'u2', name: 'Bob Jones', email: 'bob@example.com', role: 'editor', createdAt: '2023-02-20T11:30:00Z', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150' },
  { id: 'u3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'viewer', createdAt: '2023-03-05T09:15:00Z', avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150' },
  { id: 'u4', name: 'Diana Prince', email: 'diana@example.com', role: 'admin', createdAt: '2023-04-10T14:45:00Z', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
  { id: 'u5', name: 'Ethan Hunt', email: 'ethan@example.com', role: 'editor', createdAt: '2023-05-12T16:20:00Z' },
  { id: 'u6', name: 'Fiona Gallagher', email: 'fiona@example.com', role: 'editor', createdAt: '2023-06-18T08:05:00Z', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
  { id: 'u7', name: 'George Miller', email: 'george@example.com', role: 'viewer', createdAt: '2023-07-22T13:10:00Z' },
  { id: 'u8', name: 'Hannah Abbott', email: 'hannah@example.com', role: 'editor', createdAt: '2023-08-30T17:55:00Z', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
];

export const mockImages: Image[] = [
  { id: 'img1', url: 'https://images.unsplash.com/photo-1686191128892-3b37add4c844?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1686191128892-3b37add4c844?w=200', prompt: 'Cyberpunk city street at night with neon lights', aspectRatio: '16:9', style: 'Cinematic', createdAt: '2024-01-01T10:00:00Z', projectId: 'p1' },
  { id: 'img2', url: 'https://images.unsplash.com/photo-1675426513958-86c2e3998b3f?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1675426513958-86c2e3998b3f?w=200', prompt: 'Abstract fluid art with gold and blue', aspectRatio: '1:1', style: 'Digital Art', createdAt: '2024-01-02T11:00:00Z', projectId: 'p1' },
  { id: 'img3', url: 'https://images.unsplash.com/photo-1684496222627-2b721e065790?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1684496222627-2b721e065790?w=200', prompt: 'Surreal landscape with floating islands', aspectRatio: '4:3', style: '3D Render', createdAt: '2024-01-03T14:30:00Z', projectId: 'p2' },
  { id: 'img4', url: 'https://images.unsplash.com/photo-1683009427666-340595e57e43?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1683009427666-340595e57e43?w=200', prompt: 'Minimalist workspace with plants and sunlight', aspectRatio: '16:9', style: 'Photorealistic', createdAt: '2024-01-05T09:15:00Z', projectId: 'p2' },
  { id: 'img5', url: 'https://images.unsplash.com/photo-1678129780136-24eb2d1f9cc0?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1678129780136-24eb2d1f9cc0?w=200', prompt: 'A futuristic sports car on a mountain road', aspectRatio: '21:9', style: 'Cinematic', createdAt: '2024-01-06T16:45:00Z', projectId: 'p3' },
  { id: 'img6', url: 'https://images.unsplash.com/photo-1682687982501-1e58f81012a9?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1682687982501-1e58f81012a9?w=200', prompt: 'A cozy coffee shop in autumn', aspectRatio: '1:1', style: 'Watercolor', createdAt: '2024-01-08T08:20:00Z' },
  { id: 'img7', url: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=200', prompt: 'Deep sea creatures glowing in the dark', aspectRatio: '3:4', style: 'Digital Art', createdAt: '2024-01-10T20:10:00Z', projectId: 'p4' },
  { id: 'img8', url: 'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?w=200', prompt: 'A beautiful sunset over a tropical beach', aspectRatio: '16:9', style: 'Photorealistic', createdAt: '2024-01-12T18:00:00Z' },
  { id: 'img9', url: 'https://images.unsplash.com/photo-1682685797507-9e7ee87ba579?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1682685797507-9e7ee87ba579?w=200', prompt: 'Cybernetic tiger roaring', aspectRatio: '1:1', style: 'Anime', createdAt: '2024-01-14T11:45:00Z' },
  { id: 'img10', url: 'https://images.unsplash.com/photo-1682687221080-5cb261c645cb?w=800', thumbnailUrl: 'https://images.unsplash.com/photo-1682687221080-5cb261c645cb?w=200', prompt: 'A serene Japanese garden in spring', aspectRatio: '4:3', style: 'Minimalist', createdAt: '2024-01-15T07:30:00Z', projectId: 'p5' },
];

export const mockVideos: Video[] = [
  { id: 'vid1', url: 'https://example.com/video1.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400', prompt: 'Time-lapse of blooming flowers', duration: 15, createdAt: '2024-02-01T10:00:00Z', projectId: 'p1' },
  { id: 'vid2', url: 'https://example.com/video2.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400', prompt: 'Drone shot over mountains', duration: 30, createdAt: '2024-02-02T12:00:00Z', projectId: 'p2' },
  { id: 'vid3', url: 'https://example.com/video3.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1518130831622-498be698f1a8?w=400', prompt: 'Cinematic car driving in rain', duration: 10, createdAt: '2024-02-05T09:30:00Z' },
  { id: 'vid4', url: 'https://example.com/video4.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400', prompt: 'AI generated talking avatar', duration: 60, createdAt: '2024-02-08T14:15:00Z', projectId: 'p3' },
  { id: 'vid5', url: 'https://example.com/video5.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400', prompt: 'Cooking tutorial abstract fast forward', duration: 45, createdAt: '2024-02-10T11:00:00Z' },
  { id: 'vid6', url: 'https://example.com/video6.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400', prompt: 'Neon city panning shot', duration: 20, createdAt: '2024-02-12T16:20:00Z', projectId: 'p1' },
  { id: 'vid7', url: 'https://example.com/video7.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1516280440502-8618eb30a213?w=400', prompt: 'Particle simulation exploding', duration: 12, createdAt: '2024-02-15T08:45:00Z' },
  { id: 'vid8', url: 'https://example.com/video8.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400', prompt: 'Underwater coral reef exploration', duration: 25, createdAt: '2024-02-18T13:30:00Z', projectId: 'p4' },
];

export const mockCaptions: Caption[] = [
  { id: 'cap1', text: 'Unlock your potential with our new AI tools! 🚀 #Innovation #AI', tone: 'Inspirational', platform: 'LinkedIn', createdAt: '2024-03-01T09:00:00Z' },
  { id: 'cap2', text: 'Who else needs coffee before functioning? ☕️😅', tone: 'Humorous', platform: 'Twitter', createdAt: '2024-03-02T08:30:00Z' },
  { id: 'cap3', text: 'Check out the latest features in our Q1 release. A thread 🧵', tone: 'Professional', platform: 'Twitter', createdAt: '2024-03-03T10:15:00Z' },
  { id: 'cap4', text: '5 tips to improve your workflow today! Swipe to learn more 👉', tone: 'Educational', platform: 'Instagram', createdAt: '2024-03-05T12:00:00Z' },
  { id: 'cap5', text: 'Don\'t miss out on our limited time offer! 50% off all plans.', tone: 'Persuasive', platform: 'Facebook', createdAt: '2024-03-08T15:45:00Z' },
  { id: 'cap6', text: 'Behind the scenes at the office! Always a fun time with the team.', tone: 'Casual', platform: 'Instagram', createdAt: '2024-03-10T16:30:00Z' },
  { id: 'cap7', text: 'The future of digital art is here. Try our new image generator.', tone: 'Professional', platform: 'LinkedIn', createdAt: '2024-03-12T11:20:00Z' },
  { id: 'cap8', text: 'Happy Friday! What are your weekend plans? 🎉', tone: 'Casual', platform: 'Facebook', createdAt: '2024-03-15T17:00:00Z' },
];

export const mockHashtags: Hashtag[] = [
  { id: 'h1', tag: 'AI', volume: 5000000, category: 'Technology' },
  { id: 'h2', tag: 'DigitalArt', volume: 2000000, category: 'Art' },
  { id: 'h3', tag: 'Productivity', volume: 1500000, category: 'Business' },
  { id: 'h4', tag: 'Innovation', volume: 3000000, category: 'Technology' },
  { id: 'h5', tag: 'Marketing', volume: 4500000, category: 'Business' },
  { id: 'h6', tag: 'Design', volume: 8000000, category: 'Art' },
  { id: 'h7', tag: 'Startup', volume: 2500000, category: 'Business' },
  { id: 'h8', tag: 'TechTrends', volume: 800000, category: 'Technology' },
  { id: 'h9', tag: 'CreativeProcess', volume: 500000, category: 'Art' },
  { id: 'h10', tag: 'FutureOfWork', volume: 1200000, category: 'Business' },
];

export const mockPosts: Post[] = [
  { id: 'post1', content: 'Excited to announce our new product launch! 🚀', mediaUrls: [mockImages[0].url], platform: 'LinkedIn', status: 'published', publishedAt: '2024-04-01T10:00:00Z', metrics: { likes: 345, comments: 42, shares: 15, reach: 5000 }, createdAt: '2024-03-25T09:00:00Z' },
  { id: 'post2', content: 'Just testing some new AI art styles today. What do you think? 🎨', mediaUrls: [mockImages[1].url, mockImages[2].url], platform: 'Instagram', status: 'published', publishedAt: '2024-04-05T12:30:00Z', metrics: { likes: 1200, comments: 85, shares: 30, reach: 15000 }, createdAt: '2024-04-02T11:00:00Z' },
  { id: 'post3', content: 'Drafting our Q3 strategy...', mediaUrls: [], platform: 'Twitter', status: 'draft', createdAt: '2024-04-10T14:15:00Z' },
  { id: 'post4', content: 'Join our webinar next week to learn about automation.', mediaUrls: [mockImages[3].url], platform: 'Facebook', status: 'scheduled', scheduledAt: '2024-05-01T15:00:00Z', createdAt: '2024-04-15T09:30:00Z' },
  { id: 'post5', content: 'A quick tutorial on how to use the new video editor.', mediaUrls: [mockVideos[0].url], platform: 'YouTube', status: 'published', publishedAt: '2024-04-12T16:00:00Z', metrics: { likes: 890, comments: 120, shares: 45, reach: 20000 }, createdAt: '2024-04-10T10:00:00Z' },
  { id: 'post6', content: 'Oops, something went wrong with this post.', mediaUrls: [], platform: 'Twitter', status: 'failed', createdAt: '2024-04-18T08:45:00Z' },
  { id: 'post7', content: 'Behind the scenes at the studio today.', mediaUrls: [mockImages[4].url], platform: 'Instagram', status: 'scheduled', scheduledAt: '2024-05-05T12:00:00Z', createdAt: '2024-04-20T11:20:00Z' },
  { id: 'post8', content: 'The impact of AI on digital marketing in 2024.', mediaUrls: [mockImages[5].url], platform: 'LinkedIn', status: 'published', publishedAt: '2024-04-22T09:00:00Z', metrics: { likes: 560, comments: 78, shares: 25, reach: 8000 }, createdAt: '2024-04-20T14:00:00Z' },
];

export const mockNotifications: Notification[] = [
  { id: 'notif1', title: 'Post Published', message: 'Your post to LinkedIn was published successfully.', type: 'success', isRead: false, createdAt: '2024-04-22T09:05:00Z' },
  { id: 'notif2', title: 'Image Generation Complete', message: 'Your 4 images for "Cyberpunk city" are ready.', type: 'info', isRead: true, createdAt: '2024-04-21T15:30:00Z' },
  { id: 'notif3', title: 'Post Failed', message: 'Failed to publish post to Twitter. Please reconnect your account.', type: 'error', isRead: false, createdAt: '2024-04-18T08:50:00Z' },
  { id: 'notif4', title: 'Low Credits', message: 'You have less than 100 credits remaining this month.', type: 'warning', isRead: false, createdAt: '2024-04-15T10:00:00Z' },
  { id: 'notif5', title: 'New Follower Milestone', message: 'You reached 10,000 followers on Instagram!', type: 'success', isRead: true, createdAt: '2024-04-10T12:00:00Z' },
  { id: 'notif6', title: 'Video Processing Complete', message: 'Your video "Drone shot" has finished rendering.', type: 'info', isRead: true, createdAt: '2024-04-05T14:20:00Z' },
  { id: 'notif7', title: 'System Maintenance', message: 'Scheduled maintenance this Saturday at 2 AM EST.', type: 'info', isRead: false, createdAt: '2024-04-25T08:00:00Z' },
  { id: 'notif8', title: 'Subscription Renewed', message: 'Your Pro plan has been successfully renewed.', type: 'success', isRead: true, createdAt: '2024-04-01T00:00:00Z' },
];

export const mockAnalytics: Analytics[] = [
  { month: 'Jan', images: 120, videos: 15, posts: 45, reach: 50000, likes: 2500, shares: 300, comments: 450, followers: 10500 },
  { month: 'Feb', images: 135, videos: 20, posts: 52, reach: 55000, likes: 2800, shares: 350, comments: 500, followers: 11000 },
  { month: 'Mar', images: 150, videos: 18, posts: 60, reach: 62000, likes: 3100, shares: 400, comments: 580, followers: 11800 },
  { month: 'Apr', images: 180, videos: 25, posts: 68, reach: 75000, likes: 3800, shares: 500, comments: 700, followers: 12500 },
  { month: 'May', images: 210, videos: 30, posts: 75, reach: 88000, likes: 4500, shares: 600, comments: 850, followers: 13400 },
  { month: 'Jun', images: 250, videos: 35, posts: 82, reach: 105000, likes: 5200, shares: 750, comments: 1000, followers: 14500 },
  { month: 'Jul', images: 280, videos: 40, posts: 90, reach: 120000, likes: 6000, shares: 900, comments: 1200, followers: 15800 },
  { month: 'Aug', images: 310, videos: 45, posts: 95, reach: 135000, likes: 6800, shares: 1050, comments: 1400, followers: 17200 },
  { month: 'Sep', images: 340, videos: 50, posts: 105, reach: 150000, likes: 7500, shares: 1200, comments: 1600, followers: 18900 },
  { month: 'Oct', images: 380, videos: 55, posts: 115, reach: 170000, likes: 8500, shares: 1400, comments: 1850, followers: 20500 },
  { month: 'Nov', images: 420, videos: 60, posts: 125, reach: 195000, likes: 9800, shares: 1650, comments: 2100, followers: 22400 },
  { month: 'Dec', images: 450, videos: 70, posts: 140, reach: 220000, likes: 11500, shares: 2000, comments: 2500, followers: 25000 },
];

export const mockSocialAccounts: SocialAccount[] = [
  { id: 'sa1', platform: 'Instagram', handle: '@aiautomation', followerCount: 25000, isConnected: true, profileUrl: 'https://instagram.com/aiautomation' },
  { id: 'sa2', platform: 'Twitter', handle: '@aiautomationhq', followerCount: 12500, isConnected: true, profileUrl: 'https://twitter.com/aiautomationhq' },
  { id: 'sa3', platform: 'LinkedIn', handle: 'AI Automation Inc.', followerCount: 45000, isConnected: true, profileUrl: 'https://linkedin.com/company/aiautomation' },
  { id: 'sa4', platform: 'Facebook', handle: 'AI Automation', followerCount: 18000, isConnected: false, profileUrl: 'https://facebook.com/aiautomation' },
  { id: 'sa5', platform: 'TikTok', handle: '@aiautomation.app', followerCount: 85000, isConnected: true, profileUrl: 'https://tiktok.com/@aiautomation.app' },
  { id: 'sa6', platform: 'YouTube', handle: 'AI Automation', followerCount: 32000, isConnected: true, profileUrl: 'https://youtube.com/c/aiautomation' },
  { id: 'sa7', platform: 'Pinterest', handle: 'aiautomation', followerCount: 5400, isConnected: false, profileUrl: 'https://pinterest.com/aiautomation' },
  { id: 'sa8', platform: 'Threads', handle: '@aiautomation', followerCount: 9200, isConnected: true, profileUrl: 'https://threads.net/@aiautomation' },
];

export const mockProjects: Project[] = [
  { id: 'p1', name: 'Q2 Marketing Campaign', description: 'Visuals and copy for the Q2 push', status: 'active', updatedAt: '2024-04-25T10:00:00Z', createdAt: '2024-03-01T09:00:00Z' },
  { id: 'p2', name: 'Website Redesign Assets', description: 'New hero images and background loops', status: 'active', updatedAt: '2024-04-20T14:30:00Z', createdAt: '2024-02-15T11:00:00Z' },
  { id: 'p3', name: 'Product Launch - V2', status: 'completed', updatedAt: '2024-03-10T16:00:00Z', createdAt: '2024-01-05T08:00:00Z' },
  { id: 'p4', name: 'Social Media Templates', description: 'Monthly batch of reusable templates', status: 'active', updatedAt: '2024-04-28T09:15:00Z', createdAt: '2024-04-01T10:00:00Z' },
  { id: 'p5', name: 'Holiday Special 2023', status: 'archived', updatedAt: '2024-01-02T12:00:00Z', createdAt: '2023-11-01T09:00:00Z' },
  { id: 'p6', name: 'Client Demo: TechCorp', status: 'active', updatedAt: '2024-04-27T11:45:00Z', createdAt: '2024-04-15T13:20:00Z' },
  { id: 'p7', name: 'Blog Post Graphics', description: 'Images for weekly blog posts', status: 'active', updatedAt: '2024-04-26T15:30:00Z', createdAt: '2024-01-20T10:00:00Z' },
  { id: 'p8', name: 'Internal Training Vids', status: 'completed', updatedAt: '2024-02-28T09:00:00Z', createdAt: '2024-02-01T08:30:00Z' },
];

export const mockScheduledPosts: ScheduledPost[] = [
  { id: 'sp1', postId: 'post4', platform: 'Facebook', scheduledTime: '2024-05-01T15:00:00Z', status: 'pending' },
  { id: 'sp2', postId: 'post7', platform: 'Instagram', scheduledTime: '2024-05-05T12:00:00Z', status: 'pending' },
  { id: 'sp3', postId: 'post8', platform: 'LinkedIn', scheduledTime: '2024-04-22T09:00:00Z', status: 'success' },
  { id: 'sp4', postId: 'post1', platform: 'Twitter', scheduledTime: '2024-04-01T10:00:00Z', status: 'success' },
  { id: 'sp5', postId: 'post6', platform: 'Twitter', scheduledTime: '2024-04-18T08:45:00Z', status: 'failed' },
  { id: 'sp6', postId: 'post2', platform: 'Instagram', scheduledTime: '2024-04-05T12:30:00Z', status: 'success' },
  { id: 'sp7', postId: 'post5', platform: 'YouTube', scheduledTime: '2024-04-12T16:00:00Z', status: 'success' },
  { id: 'sp8', postId: 'post3', platform: 'Twitter', scheduledTime: '2024-05-10T14:00:00Z', status: 'pending' },
];

export const mockWorkspaceMembers: WorkspaceMember[] = [
  { id: 'wm1', userId: 'u1', user: mockUsers[0], role: 'admin', joinedAt: '2023-01-15T10:00:00Z' },
  { id: 'wm2', userId: 'u2', user: mockUsers[1], role: 'editor', joinedAt: '2023-02-20T11:30:00Z' },
  { id: 'wm3', userId: 'u3', user: mockUsers[2], role: 'viewer', joinedAt: '2023-03-05T09:15:00Z' },
  { id: 'wm4', userId: 'u4', user: mockUsers[3], role: 'admin', joinedAt: '2023-04-10T14:45:00Z' },
  { id: 'wm5', userId: 'u5', user: mockUsers[4], role: 'editor', joinedAt: '2023-05-12T16:20:00Z' },
  { id: 'wm6', userId: 'u6', user: mockUsers[5], role: 'editor', joinedAt: '2023-06-18T08:05:00Z' },
  { id: 'wm7', userId: 'u7', user: mockUsers[6], role: 'viewer', joinedAt: '2023-07-22T13:10:00Z' },
  { id: 'wm8', userId: 'u8', user: mockUsers[7], role: 'editor', joinedAt: '2023-08-30T17:55:00Z' },
];

export const mockRecentActivity = [
  { id: 'act1', type: 'post_published', description: 'Post published to LinkedIn', date: '2024-04-25T14:30:00Z', user: mockUsers[0] },
  { id: 'act2', type: 'image_generated', description: 'Generated 4 images for Project Q2', date: '2024-04-25T11:15:00Z', user: mockUsers[1] },
  { id: 'act3', type: 'video_rendered', description: 'Video render completed for Intro', date: '2024-04-24T16:45:00Z', user: mockUsers[3] },
  { id: 'act4', type: 'project_created', description: 'Created new project "Summer Campaign"', date: '2024-04-23T09:00:00Z', user: mockUsers[0] },
  { id: 'act5', type: 'member_added', description: 'Added Alice to Workspace', date: '2024-04-22T10:20:00Z', user: mockUsers[0] },
  { id: 'act6', type: 'social_connected', description: 'Connected TikTok account', date: '2024-04-21T15:10:00Z', user: mockUsers[1] },
  { id: 'act7', type: 'caption_generated', description: 'Generated 5 captions for Instagram', date: '2024-04-20T13:00:00Z', user: mockUsers[4] },
  { id: 'act8', type: 'post_scheduled', description: 'Scheduled post for Facebook', date: '2024-04-19T08:30:00Z', user: mockUsers[5] },
];
