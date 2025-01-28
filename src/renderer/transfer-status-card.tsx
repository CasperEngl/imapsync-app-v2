import { CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";
import { Button } from '~/renderer/components/ui/button.js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '~/renderer/components/ui/card.js';
import { store, type TransferState, type TransferStatus } from '~/renderer/store.js';

const keyMap = {
  idle: {
    text: "Idle",
    icon: <Clock className="size-4" />,
  },
  syncing: {
    text: "Syncing",
    icon: <RefreshCw className="size-4" />,
  },
  completed: {
    text: "Completed",
    icon: <CheckCircle className="size-4" />,
  },
  error: {
    text: "Error",
    icon: <XCircle className="size-4" />,
  },
} satisfies Record<TransferStatus, {
  text: string
  icon: React.ReactNode
}>;

export function TransferStatusCard({
  transfers,
  status,
}: {
  transfers: TransferState[];
  status: TransferStatus;
}) {
  const key = keyMap[status];
  return (
    <Card className="relative group flex flex-col items-center overflow-clip">
      <CardHeader className="px-4 pt-4 pb-1 text-2xl font-black">
        {transfers.length}
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <CardDescription className="flex items-center gap-2">
          <div className="text-muted-foreground">{key.icon}</div>
          <span className="text-accent-foreground font-medium">{key.text}</span>
        </CardDescription>
      </CardContent>
      <CardFooter className="p-0 w-full divide-x divide-border border-t">
        <Button
          className="h-auto w-full rounded-none" variant="ghost"
          onClick={() => {
            store.send({
              type: 'removeAllByStatus',
              status,
            })
          }}
        >
          Remove
        </Button>
        <Button
          className="h-auto w-full rounded-none" variant="ghost"
          onClick={() => {
            store.send({
              type: 'keepAllByStatus',
              status,
            })
          }}
        >
          Keep
        </Button>
      </CardFooter>
    </Card>
  );
}
