import { useIsFetching } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

export function DataLoadingIndicator() {
  const pendingInitialQueries = useIsFetching({
    predicate: (query) => query.state.data === undefined
  });

  if (pendingInitialQueries === 0) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-background/70 px-5 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl border bg-surface px-5 py-4 shadow-lg">
        <LoaderCircle className="size-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Cargando datos...</span>
      </div>
    </div>
  );
}
