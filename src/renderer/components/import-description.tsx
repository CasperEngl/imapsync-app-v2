import { ArrowRightLeft } from "lucide-react";

import type { Transfer } from "~/renderer/schemas.js";

export function ImportDescription({
  transfer,
}: {
  transfer: {
    source: Transfer;
    destination: Transfer;
  };
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-muted-foreground">Source</div>
      <div className="flex gap-1 items-center text-sm">
        <span className="font-medium">{transfer.source.user}</span>
        <ArrowRightLeft className="size-4 text-muted-foreground/50"></ArrowRightLeft>
        <span className="font-medium">{transfer.source.host}</span>
      </div>
      <div className="text-xs text-muted-foreground">Destination</div>
      <div className="flex gap-1 items-center text-sm">
        <span className="font-medium">{transfer.destination.user}</span>
        <ArrowRightLeft className="size-4 text-muted-foreground/50"></ArrowRightLeft>
        <span className="font-medium">{transfer.destination.host}</span>
      </div>
    </div>
  );
}
