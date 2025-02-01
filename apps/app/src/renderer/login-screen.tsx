import { useAuth } from "~/renderer/auth-provider.hooks.js";

export function LoginScreen() {
  const auth = useAuth();

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto">
        {auth?.login.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {auth?.login.error.message}
          </div>
        )}
        <h1 className="text-accent-foreground mb-6 text-2xl font-bold max-w-lg text-pretty">
          Please log in to access the imapsync App.
        </h1>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={auth?.login.isPending}
          onClick={() => auth?.login.mutate()}
        >
          {auth?.login.isPending ? "Processing..." : "Login"}
        </button>
      </div>
    </div>
  );
}
