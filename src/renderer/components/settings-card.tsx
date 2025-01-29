import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from '@xstate/store/react'
import { useId } from 'react'
import { toast } from 'sonner'
import { Button } from '~/renderer/components/ui/button.js'
import { Card, CardContent, CardHeader, CardTitle } from '~/renderer/components/ui/card.js'
import { Checkbox } from '~/renderer/components/ui/checkbox.js'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/renderer/components/ui/dropdown-menu.js'
import { Input } from '~/renderer/components/ui/input.js'
import { Label } from '~/renderer/components/ui/label.js'
import { Skeleton } from '~/renderer/components/ui/skeleton.js'
import { store } from '~/renderer/store.js'

export function SettingsCard() {
  const exportWithStateId = useId()
  const logDirInputId = useId()
  const imapsyncInputId = useId()
  const queryClient = useQueryClient()
  const transfers = useSelector(store, snapshot => snapshot.context.transfers)
  const exportWithState = useSelector(store, snapshot => snapshot.context.settings.exportWithState)
  // Query for fetching log directory
  const logDirectoryQuery = useQuery({
    queryKey: ['logDirectory'],
    queryFn: () => window.api.getLogDirectory(),
  })

  // Query for fetching imapsync path
  const imapsyncPathQuery = useQuery({
    queryKey: ["imapsyncPath"],
    queryFn: () => window.api.getImapsyncPath(),
  });

  // Mutation for updating log directory
  const updateDirectoryMutation = useMutation({
    mutationFn: async () => {
      await window.api.selectLogDirectory()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logDirectory'] })
    }
  })

  // Mutation for selecting imapsync binary
  const selectBinaryMutation = useMutation({
    mutationFn: async () => {
      await window.api.selectImapsyncBinary();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to upload binary");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['imapsyncPath'] })
    }
  });

  const handleSelectDirectory = async () => {
    updateDirectoryMutation.mutate()
  }

  const handleSelectBinary = () => {
    selectBinaryMutation.mutate();
  };

  // Add the export transfers handler
  const handleExportTransfers = async (options: { exportAs: "json" | "csv" }) => {
    try {
      const { success } = await window.api.exportTransfers(transfers, {
        exportAs: options.exportAs,
        withState: exportWithState,
      });

      if (success) {
        toast.success('Transfers exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export transfers');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={logDirInputId}>Log Directory</Label>
          <div className="mt-1 flex items-center space-x-2">
            {logDirectoryQuery.isPending ? (
              <Skeleton className="h-9 flex-1" />
            ) : (
              <Input
                id={logDirInputId}
                type="text"
                readOnly
                value={logDirectoryQuery.data}
              />
            )}
            <Button
              onClick={handleSelectDirectory}
              disabled={updateDirectoryMutation.isPending}
            >
              Browse
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor={imapsyncInputId}>imapsync Binary</Label>
          <div className="mt-1 flex items-center space-x-2">
            {imapsyncPathQuery.isLoading ? (
              <Skeleton className="h-9 flex-1" />
            ) : (
              <Input
                id={imapsyncInputId}
                type="text"
                readOnly
                value={imapsyncPathQuery.data ?? ''}
                className="text-sm break-all flex-1"
              />
            )}
            <Button
              onClick={handleSelectBinary}
              disabled={selectBinaryMutation.isPending}
            >
              {selectBinaryMutation.isPending ? "Uploading..." : "Browse"}
            </Button>
          </div>
          {selectBinaryMutation.isError && (
            <div className="text-red-500 mt-2">
              {selectBinaryMutation.error instanceof Error
                ? selectBinaryMutation.error.message
                : "Failed to upload binary"}
            </div>
          )}
        </div>

        <div className="mt-4">
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
          <div className="flex items-center gap-2 mt-2">
            <Checkbox
              id={exportWithStateId}
              checked={exportWithState}
              onCheckedChange={() => store.send({ type: "toggleExportWithState" })}
            />
            <Label htmlFor={exportWithStateId}>Export with transfer state</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
