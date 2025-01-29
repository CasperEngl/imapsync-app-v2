import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { toast } from 'sonner'
import { Button } from '~/renderer/components/ui/button.js'
import { Card, CardContent, CardHeader, CardTitle } from '~/renderer/components/ui/card.js'
import { Input } from '~/renderer/components/ui/input.js'
import { Label } from '~/renderer/components/ui/label.js'
import { Skeleton } from '~/renderer/components/ui/skeleton.js'

export function SettingsCard() {
  const logDirInputId = useId()
  const imapsyncInputId = useId()
  const queryClient = useQueryClient()

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
      </CardContent>
    </Card>
  )
} 
