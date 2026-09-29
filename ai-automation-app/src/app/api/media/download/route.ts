export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

function isAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || `media-download-${Date.now()}`;

    if (!mediaUrl || !isAllowedUrl(mediaUrl)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or restricted media URL' },
        { status: 400 },
      );
    }

    const response = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'AI-Automation-MediaDownloader/1.0',
      },
    });

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch remote media: ${response.statusText}` },
        { status: response.status || 502 },
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    // Clean filename of invalid characters
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };

    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    return new NextResponse(response.body as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Media download proxy error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Media download proxy error' },
      { status: 500 },
    );
  }
}
