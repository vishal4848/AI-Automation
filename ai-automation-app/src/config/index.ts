export const APP_CONFIG = {
  name: 'AI Automation',
  navigation: [
    { name: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
    { name: 'Image Studio', href: '/image-studio', icon: 'Image' },
    { name: 'Video Studio', href: '/video-studio', icon: 'Video' },
    { name: 'Social Scheduler', href: '/scheduler', icon: 'CalendarDays' },
    { name: 'Analytics', href: '/analytics', icon: 'BarChart3' },
    { name: 'Settings', href: '/settings', icon: 'Settings' },
  ],
  socialPlatforms: [
    'Instagram',
    'Facebook',
    'LinkedIn',
    'Twitter',
    'TikTok',
    'YouTube',
    'Pinterest',
    'Threads'
  ],
  aiModels: [
    { id: 'midjourney-v6', name: 'Midjourney v6', provider: 'Midjourney' },
    { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI' },
    { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: 'Stability AI' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'runway-gen3', name: 'Runway Gen-3', provider: 'Runway' },
  ],
  aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'],
  styles: ['Photorealistic', 'Anime', 'Digital Art', 'Cinematic', '3D Render', 'Watercolor', 'Minimalist'],
  tones: ['Professional', 'Casual', 'Humorous', 'Inspirational', 'Educational', 'Persuasive'],
  languages: ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese'],
};
