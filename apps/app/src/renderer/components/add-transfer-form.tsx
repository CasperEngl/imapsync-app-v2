import { Combobox } from "~/renderer/components/combobox.js";
import { Input } from "~/renderer/components/ui/input.js";
import type { Transfer } from "~/renderer/schemas.js";

interface AddTransferFormProps {
  newTransfer: {
    source: Transfer;
    destination: Transfer;
  };
  onSourceChange: (field: string, value: string) => void;
  onDestinationChange: (field: string, value: string) => void;
  onAddTransfer: () => void;
  hostOptions: Array<{ label: string; value: string }>;
}

export function AddTransferForm({
  hostOptions,
  newTransfer,
  onSourceChange,
  onDestinationChange,
  onAddTransfer,
}: AddTransferFormProps) {
  return (

    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAddTransfer();
      }}
    >
      <div className="@container/form">
        <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">Source</h3>
            <Combobox
              className="w-full"
              onValueChange={(value) => {
                onSourceChange("host", value);
              }}
              options={hostOptions}
              placeholder="Select or enter host..."
              searchPlaceholder="Search hosts..."
              value={newTransfer.source.host}
            />
            <Input
              onChange={(event) => {
                onSourceChange("user", event.target.value);
                onDestinationChange("user", event.target.value);
              }}
              placeholder="Username"
              type="text"
              value={newTransfer.source.user}
            />
            <Input
              onChange={(event) => {
                onSourceChange("password", event.target.value);
              }}
              placeholder="Password"
              type="password"
              value={newTransfer.source.password}
            />
          </div>
          <div className="space-y-4">
            <h3 className="font-medium">Destination</h3>
            <Combobox
              className="w-full"
              onValueChange={(value) => {
                onDestinationChange("host", value);
              }}
              options={hostOptions}
              placeholder="Select or enter host..."
              searchPlaceholder="Search hosts..."
              value={newTransfer.destination.host}
            />
            <Input
              onChange={(event) => {
                onDestinationChange("user", event.target.value);
              }}
              placeholder="Username"
              type="text"
              value={newTransfer.destination.user}
            />
            <Input
              onChange={(event) => {
                onDestinationChange("password", event.target.value);
              }}
              placeholder="Password"
              type="password"
              value={newTransfer.destination.password}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
