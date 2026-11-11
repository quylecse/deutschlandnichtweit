import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(): string {
  let url = (
    process.env.BACKEND_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://deutschlandnichtweit.onrender.com/api'
  ).trim().replace(/\/$/, '');

  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
}

const BACKEND_URL = getBackendUrl();

async function proxyCommunityRequest(req: NextRequest, endpoint: string) {
  try {
    const searchParams = req.nextUrl.search;
    const targetUrl = `${BACKEND_URL}/community/${endpoint}${searchParams}`;
    const headers = new Headers();

    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);

    const cookie = req.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);

    const userAgent = req.headers.get('user-agent');
    if (userAgent) headers.set('user-agent', userAgent);

    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.text();
    }

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const resContentType = backendRes.headers.get('content-type') || '';
    const resText = await backendRes.text();

    let data: unknown;
    if (resContentType.includes('application/json')) {
      try {
        data = JSON.parse(resText);
      } catch {
        data = { message: 'INTERNAL_SERVER_ERROR' };
      }
    } else {
      data = {
        message: backendRes.ok
          ? 'SUCCESS'
          : `BACKEND_UNAVAILABLE (${backendRes.status})`,
      };
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error(`Lỗi proxy community endpoint ${endpoint}:`, error);
    return NextResponse.json(
      { message: 'CANNOT_CONNECT_TO_SERVER' },
      { status: 503 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join('/');
  return proxyCommunityRequest(req, endpoint);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join('/');
  return proxyCommunityRequest(req, endpoint);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join('/');
  return proxyCommunityRequest(req, endpoint);
}
