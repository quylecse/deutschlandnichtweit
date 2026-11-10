import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api'
).replace(/\/$/, '');

async function proxyAuthRequest(req: NextRequest, endpoint: string) {
  try {
    const targetUrl = `${BACKEND_URL}/auth/${endpoint}`;
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
      // Nếu backend trả về HTML lỗi hoặc lỗi gateway 502/504
      data = {
        message: backendRes.ok
          ? 'SUCCESS'
          : `BACKEND_UNAVAILABLE (${backendRes.status})`,
      };
    }

    const nextRes = NextResponse.json(data, { status: backendRes.status });

    // Chuyển tiếp toàn bộ Set-Cookie (HttpOnly JWT token) từ NestJS về lại trình duyệt
    const setCookieHeaders = backendRes.headers.getSetCookie
      ? backendRes.headers.getSetCookie()
      : [backendRes.headers.get('set-cookie')].filter(Boolean);

    setCookieHeaders.forEach((cookieStr) => {
      if (cookieStr) {
        nextRes.headers.append('set-cookie', cookieStr);
      }
    });

    return nextRes;
  } catch (error) {
    console.error(`Lỗi proxy auth endpoint ${endpoint}:`, error);
    return NextResponse.json(
      { message: 'CANNOT_CONNECT_TO_AUTH_SERVER' },
      { status: 503 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join('/');
  return proxyAuthRequest(req, endpoint);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join('/');
  return proxyAuthRequest(req, endpoint);
}

