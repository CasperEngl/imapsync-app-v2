import { createClient } from "@openauthjs/openauth/client";

// Server-side only client
export const client = createClient({
  clientID: "bun-react-app",
  issuer: "http://localhost:3001",
});

export function setTokens(response: Response, access: string, refresh: string) {
  response.headers.append(
    "Set-Cookie",
    `access_token=${access}; Path=/; HttpOnly; SameSite=Lax; Max-Age=34560000`
  );
  response.headers.append(
    "Set-Cookie",
    `refresh_token=${refresh}; Path=/; HttpOnly; SameSite=Lax; Max-Age=34560000`
  );
  return response;
}

export function getTokens(request: Request) {
  const cookies = new URLSearchParams(
    request.headers.get("cookie")?.split("; ").join("&") || ""
  );

  return {
    access: cookies.get("access_token"),
    refresh: cookies.get("refresh_token"),
  };
}

export function clearTokens(response: Response) {
  response.headers.append(
    "Set-Cookie",
    "access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );
  response.headers.append(
    "Set-Cookie",
    "refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );
  return response;
}
