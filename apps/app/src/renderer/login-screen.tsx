import { useAuth } from "~/renderer/auth-provider.hooks.js";

export function LoginScreen() {
  const auth = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          IMAP Sync App
        </h1>
        {auth?.login.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {auth?.login.error.message}
          </div>
        )}
        <button
          onClick={() => auth?.login.mutate()}
          disabled={auth?.login.isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {auth?.login.isPending ? "Processing..." : "Login"}
        </button>
      </div>
    </div>
  );
}