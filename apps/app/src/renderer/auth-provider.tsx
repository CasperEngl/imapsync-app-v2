import { createClient } from "@openauthjs/openauth/client";
import { InvalidAccessTokenError } from "@openauthjs/openauth/error";
import { useMutation, useQuery } from "@tanstack/react-query";
import { subjects } from "auth-subjects/subjects.js";
import { AuthContext } from "~/renderer/auth-provider.context.js";
import { queryClient } from "~/renderer/providers.js";

export const authClient = createClient({
  clientID: 'imapsync-app',
  issuer: 'http://localhost:3000',
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      const challenge = JSON.parse(localStorage.getItem("challenge") || '{}')
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')

      // If we have a challenge in progress, handle the OAuth code exchange
      if (challenge.verifier) {
        const query = new URLSearchParams(window.location.search)
        const exchanged = await authClient.exchange(
          query.get("code") || '',
          window.origin,
          challenge.verifier
        )

        localStorage.removeItem('challenge')

        if (exchanged.err) {
          throw new InvalidAccessTokenError();
        }

        localStorage.setItem('access_token', exchanged.tokens.access);
        localStorage.setItem('refresh_token', exchanged.tokens.refresh);

        const response = await authClient.verify(subjects, exchanged.tokens.access, {
          refresh: exchanged.tokens.refresh,
        })

        if (response.err) {
          throw new InvalidAccessTokenError();
        }

        return response.subject.properties;
      }

      // If we don't have any tokens, we're not authenticated
      if (!accessToken || !refreshToken) {
        throw new InvalidAccessTokenError();
      }

      // Verify existing tokens
      const response = await authClient.verify(subjects, accessToken, {
        refresh: refreshToken,
      })

      if (response.err) {
        throw new InvalidAccessTokenError();
      }

      return response.subject.properties;
    },
    retry: false,
  });

  const login = useMutation({
    mutationFn: async () => {
      const response = await authClient.authorize(window.origin, 'code', {
        pkce: true,
      });

      return response;
    },
    onSuccess: (response) => {
      localStorage.setItem('challenge', JSON.stringify(response.challenge));
      location.href = response.url;
    },
  })

  const logout = useMutation({
    mutationFn: async () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('challenge');
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onSuccess: () => {
      location.href = '/';
    },
  })

  return (
    <AuthContext
      value={{
        user: auth,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}