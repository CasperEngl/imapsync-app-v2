import type { AuthorizeResult } from "@openauthjs/openauth/client";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

import { createContext } from "react";

interface AuthContextType {
  user: UseQueryResult<{
    id: number;
    email: string;
    createdAt: string;
  }, Error>;
  login: UseMutationResult<AuthorizeResult, Error, void, unknown>;
  logout: UseMutationResult<void, Error, void, unknown>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
