"use server";

import { clearTokens, client, getTokens, setTokens } from "./client";
import { subjects } from "./subjects";

export async function auth(request: Request) {
  const { access, refresh } = getTokens(request);

  if (!access || !refresh) {
    return null;
  }

  const verified = await client.verify(subjects, access, {
    refresh,
  });

  if (verified.err) {
    return null;
  }

  return verified.subject.properties;
}

export async function login(request: Request) {
  const { access, refresh } = getTokens(request);

  if (access && refresh) {
    const verified = await client.verify(subjects, access, {
      refresh,
    });

    if (!verified.err && verified.tokens) {
      setTokens(
        new Response(),
        verified.tokens.access,
        verified.tokens.refresh
      );
      return Response.json({ redirect: "/" });
    }
  }

  const url = new URL(request.url);
  const { url: authUrl } = await client.authorize(
    `${url.protocol}//${url.host}/api/callback`,
    "code"
  );

  return Response.json({ loginUrl: authUrl });
}

export async function logout(request: Request) {
  const url = new URL(request.url);
  const response = Response.json({ redirect: url.origin });
  clearTokens(response);
  return response;
}

export async function callback(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const response = Response.redirect(url.origin);

  if (!code) {
    return response;
  }

  const exchanged = await client.exchange(code, `${url.origin}/api/callback`);

  if (exchanged.err) return Response.json(exchanged.err, { status: 400 });

  setTokens(response, exchanged.tokens.access, exchanged.tokens.refresh);

  return response;
}
