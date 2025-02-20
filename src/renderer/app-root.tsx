import { captureException } from "@sentry/electron";
import { ErrorBoundary } from "react-error-boundary";
import { useMeasure } from "react-use";

import { App } from "~/renderer/app.js";
import { Button } from "~/renderer/components/ui/button.js";
import { Card, CardContent } from "~/renderer/components/ui/card.js";
import { clearPersistedState } from "~/renderer/persist-state.js";

export function AppRoot() {
  const [appBarRef, appBarMeasure] = useMeasure<HTMLDivElement>();

  return (
    <div className="relative bg-white dark:bg-zinc-900">
      <div
        className="[app-region:drag] z-10 sticky top-0 h-10 select-all bg-accent dark:bg-black"
        ref={appBarRef}
      >
      </div>
      <header className="relative bg-card shadow py-4 text-pretty">
        <div className="container mx-auto">
          <h1 className="text-3xl text-card-foreground font-bold">imapsync App</h1>

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

          <div className="max-w-prose">
            <p className="text-sm text-muted-foreground mt-1">
              This is a GUI frontend for imapsync. All email transfer
              functionality is provided by the imapsync tool created by Gilles
              Lamiral.
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-screen">
        <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => {
          captureException(error);

          return (
            <div className="flex flex-col items-center justify-center min-h-96 mx-auto max-w-md w-full">
              <h1 className="text-2xl font-bold text-card-foreground">An error occurred</h1>
              <Card className="w-full mt-4">
                <CardContent className="p-4">
                  <code className="text-sm text-muted-foreground">{error.message}</code>
                </CardContent>
              </Card>
              <div className="flex mt-6 gap-2">
                <Button onClick={resetErrorBoundary}>Reload app</Button>
                <Button
                  onClick={() => {
                    clearPersistedState();
                    resetErrorBoundary();
                  }}
                  variant="destructive"
                >
                  Reset state
                </Button>
              </div>
            </div>
          );
        }}
        >
          <App appBarMeasure={appBarMeasure} />
        </ErrorBoundary>
      </div>

      <footer className="container mx-auto py-8">
        <div className="max-w-prose">
          <p className="text-sm text-muted-foreground">
            © 2025 Imapsync App. Available under Personal Use License for
            personal use. Commercial use requires a separate license - contact
            {" "}
            <a
              className="underline hover:text-foreground transition-colors"
              href="mailto:me@casperengelmann.com"
            >
              me@casperengelmann.com
            </a>
          </p>

          <p className="text-sm text-red-500 mt-1">
            Note: Using this software in a business environment or for
            commercial purposes without a valid commercial license is strictly
            prohibited.
          </p>
        </div>
      </footer>
    </div>
  );
}
