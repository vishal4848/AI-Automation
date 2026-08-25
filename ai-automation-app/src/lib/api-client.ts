const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function backendFetch(path: string, options: RequestInit = {}, req?: Request): Promise<Response> {
  const url = `${BACKEND_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Forward Authorization header or auth_token cookie
  if (req) {
    const auth = req.headers.get('Authorization');
    if (auth) {
      headers['Authorization'] = auth;
    } else {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/auth_token=([^;]+)/);
      if (match && match[1]) {
        headers['Authorization'] = `Bearer ${decodeURIComponent(match[1])}`;
      }
    }
  }

  // If no auth header yet, try reading cookies from Next.js headers if available
  if (!headers['Authorization']) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {}
  }

  return fetch(url, { ...options, headers });
}

export async function backendPost<T>(path: string, body: any, req?: Request): Promise<T> {
  const response = await backendFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }, req);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Backend error' }));
    const err: any = new Error(error.message || `Backend error: ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

export async function backendGet<T>(path: string, req?: Request): Promise<T> {
  const response = await backendFetch(path, { method: 'GET' }, req);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Backend error' }));
    const err: any = new Error(error.message || `Backend error: ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

export async function backendDelete<T>(path: string, req?: Request): Promise<T> {
  const response = await backendFetch(path, { method: 'DELETE' }, req);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Backend error' }));
    const err: any = new Error(error.message || `Backend error: ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

