import { useAuth } from '~/renderer/auth-provider.hooks.js';
import { Button } from '~/renderer/components/ui/button.js';

export function AppHeader() {
  const auth = useAuth();

  return (
    <header className="relative bg-white shadow py-4">
      <div className="container mx-auto grid grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-3xl font-bold">imapsync App</h1>

          <div className="text-sm text-muted-foreground">
            Powered by
            {" "}
            <a
              className="underline hover:text-foreground transition-colors"
              href="https://imapsync.lamiral.info/"
              onClick={(e) => {
                e.preventDefault();
                void window.api.openExternalUrl(
                  "https://imapsync.lamiral.info/",
                );
              }}
              rel="noopener noreferrer"
              target="_blank"
            >
              imapsync by Gilles Lamiral
            </a>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            This is a GUI frontend for imapsync. All email transfer
            functionality is provided by the imapsync tool created by Gilles
            Lamiral.
          </p>
        </div>
        {auth?.user.data && (
          <Button onClick={() => auth.logout.mutate()}>
            Logout
          </Button>
        )}
      </div>
    </header>
  )
}