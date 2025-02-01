import { useContext } from "react";

import { AuthContext } from "~/renderer/auth-provider.context.js";

export function useAuth() {
  const context = useContext(AuthContext);

  return context;
}
