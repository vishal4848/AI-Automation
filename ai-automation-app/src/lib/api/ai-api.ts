export async function getAIModels(category?: 'IMAGE' | 'VIDEO' | 'TEXT' | 'AUDIO') {
  const url = category ? `/api/ai/models?category=${category}` : '/api/ai/models';
  const res = await fetch(url);
  const data = await res.json();
  if (data.success) {
    return data.models;
  }
  throw new Error(data.error || 'Failed to fetch models');
}

export async function generateImage(params: any) {
  const res = await fetch('/api/ai/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate image');
  }
  return data;
}

export async function generateVideo(params: any) {
  const res = await fetch('/api/ai/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate video');
  }
  return data;
}
