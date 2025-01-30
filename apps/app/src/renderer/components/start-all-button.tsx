import { useSelector } from "@xstate/store/react";
import type { VariantProps } from "class-variance-authority";
import { match } from "ts-pattern";
import { Button } from "~/renderer/components/ui/button.js";
import type { buttonVariants } from "~/renderer/components/ui/button.styles.js";
import { store } from "~/renderer/store.js";

export interface StartAllButtonState {
  isSyncing: boolean;
  isAllCompleted: boolean;
}

export interface StartAllButtonResult {
  variant: VariantProps<typeof buttonVariants>["variant"];
  text: string;
}

export function StartAllButton() {
  const transfers = useSelector(store, snapshot => snapshot.context.transfers);

  const isAllCompleted = transfers.every((transfer) => {
    return transfer.status === "completed";
  });

  const isSyncing = transfers.some((transfer) => {
    return transfer.status === "syncing";
  });

  const startAllButton = match({ isSyncing, isAllCompleted })
    .with({ isSyncing: true }, () => ({
      variant: "outline" as const,
      text: "Running...",
    }))
    .with({ isAllCompleted: true }, () => ({
      variant: "success" as const,
      text: "All transfers completed",
    }))
    .otherwise(() => ({
      variant: "default" as const,
      text: "Start all idle",
    })) as { variant: "default" | "outline" | "success"; text: string };

    return <Button
          disabled={isSyncing || isAllCompleted}
          onClick={() => {
            store.send({
              type: "startAll",
            });
          }}
          variant={startAllButton.variant}
        >
          {startAllButton.text}
        </Button>
}