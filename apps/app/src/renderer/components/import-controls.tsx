import { useSelector } from "@xstate/store/react";
import { useId, useRef } from "react";
import { toast } from "sonner";

import type { TransferWithState } from "~/renderer/schemas.js";

import { ImportDescription } from "~/renderer/components/import-description.js";
import { Button } from "~/renderer/components/ui/button.js";
import { Checkbox } from "~/renderer/components/ui/checkbox.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/renderer/components/ui/dropdown-menu.js";
import { Label } from "~/renderer/components/ui/label.js";
import { store } from "~/renderer/store.js";
import { convertCsvToTransfers } from "~/renderer/utils/convert-csv-to-transfers.js";

export function ImportControls() {
  const settings = useSelector(store, snapshot => snapshot.context.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceAllId = useId();

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") {
        toast.error("Failed to read file contents");

        return;
      }

      // If replacing all, remove existing transfers first
      if (settings.replaceAllOnImport) {
        store.send({ type: "removeAll" });
      }

      try {
        let transfers: TransferWithState[];

        if (file.name.endsWith(".csv")) {
          transfers = convertCsvToTransfers(result);
        } else {
          // Handle JSON format
          const data = JSON.parse(result);
          transfers = Array.isArray(data) ? data : [data];
        }

        // Process all transfers uniformly
        for (const transfer of transfers) {
          store.send({
            type: "addTransfer",
            ...transfer,
          });

          toast(`Imported transfer`, {
            closeButton: true,
            description: <ImportDescription transfer={transfer} />,
          });
        }

        toast("Transfers imported successfully!", {
          closeButton: true,
          description: `${transfers.length} transfers imported from ${file.name.endsWith(".csv") ? "CSV" : "JSON"}`,
        });
      } catch (error) {
        toast.error("Failed to import transfers", {
          closeButton: true,
          description:
            error instanceof Error ? error.message : "Invalid file format",
        });
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        accept=".csv,.json"
        className="hidden"
        onChange={handleBulkImport}
        ref={fileInputRef}
        type="file"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full" type="button" variant="outline">
            Import Transfers
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-(--radix-popper-anchor-width)">
          <DropdownMenuItem
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = ".csv";
                fileInputRef.current.click();
              }
            }}
          >
            Import from CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = ".json";
                fileInputRef.current.click();
              }
            }}
          >
            Import from JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          checked={settings.replaceAllOnImport}
          id={replaceAllId}
          onCheckedChange={() => store.send({ type: "toggleReplaceAllOnImport" })}
        />
        <Label htmlFor={replaceAllId}>Replace all transfers on import</Label>
      </div>
    </div>
  );
}
