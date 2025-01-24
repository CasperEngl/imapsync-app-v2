import { useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '~/renderer/components/ui/button.js';
import { Skeleton } from '~/renderer/components/ui/skeleton.js';
import { queryClient } from '~/renderer/providers.js';

export function ImapsyncBinarySelector() {
  const imapsyncPathQuery = useQuery({
    queryKey: ["imapsyncPath"],
    queryFn: () => window.api.getImapsyncPath(),
  });

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

  const handleSelectBinary = () => {
    selectBinaryMutation.mutate();
  };

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h2 className="text-lg font-semibold mb-2">imapsync Binary</h2>
      <div className="space-y-2">
        {imapsyncPathQuery.isLoading ? (
          <Skeleton className="h-5 w-full max-w-[300px]" />
        ) : imapsyncPathQuery.data ? (
          <div className="text-sm text-muted-foreground">
            Current path: {imapsyncPathQuery.data}
          </div>
        ) : null}
        <Button
          onClick={handleSelectBinary}
          disabled={selectBinaryMutation.isPending}
        >
          {selectBinaryMutation.isPending ? "Uploading..." : "Select imapsync Binary"}
        </Button>
        {selectBinaryMutation.isError && (
          <div className="text-red-500 mt-2">
            {selectBinaryMutation.error instanceof Error
              ? selectBinaryMutation.error.message
              : "Failed to upload binary"}
          </div>
        )}
      </div>
    </div>
  );
}
