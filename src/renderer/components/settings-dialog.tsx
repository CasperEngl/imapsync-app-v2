import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '~/renderer/components/ui/button.js'
import { Input } from '~/renderer/components/ui/input.js'
import { Skeleton } from '~/renderer/components/ui/skeleton.js'

export function SettingsDialog() {
  const queryClient = useQueryClient()

  // Query for fetching log directory
  const logDirectoryQuery = useQuery({
    queryKey: ['logDirectory'],
    queryFn: () => window.api.getLogDirectory(),
  })

  // Mutation for updating log directory
  const updateDirectoryMutation = useMutation({
    mutationFn: async () => {
      await window.api.selectLogDirectory()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logDirectory'] })
    }
  })

  const handleSelectDirectory = async () => {
    updateDirectoryMutation.mutate()
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Log Directory
          </label>
          <div className="mt-1 flex items-center space-x-2">
            {logDirectoryQuery.isPending ? (
              <Skeleton className="h-9 flex-1" />
            ) : (
              <Input
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
      </div>
    </div>
  )
} 
