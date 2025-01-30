import { useSelector } from "@xstate/store/react";
import { toast } from "sonner";
import { store } from "~/renderer/store.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/renderer/components/ui/dropdown-menu.js";
import { Button } from "~/renderer/components/ui/button.js";
export function ExportTransfers() {
  const transfers = useSelector(store, snapshot => snapshot.context.transfers);
  const settings = useSelector(store, snapshot => snapshot.context.settings);

  const handleExportTransfers = async (options: { exportAs: "json" | "csv" }) => {
    try {
      const { success } = await window.api.exportTransfers(transfers, {
        exportAs: options.exportAs,
        withState: settings.exportWithState,
      });

      if (success) {
        toast.success("Transfers exported successfully");
      }
    } catch {
      toast.error("Failed to export transfers");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Export Transfers</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-popper-anchor-width)">
        <DropdownMenuItem onClick={() => handleExportTransfers({ exportAs: "json" })}>
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportTransfers({ exportAs: "csv" })}>
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}