import { LoaderCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useSlowRequestStore } from "@/stores/slow-request.store";

export function SlowRequestDialog() {
  const pendingRequests = useSlowRequestStore((state) => state.pendingRequests);

  return (
    <AlertDialog open={pendingRequests > 0}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LoaderCircle className="size-5 animate-spin" />
            Estamos procesando tu solicitud
          </AlertDialogTitle>
          <AlertDialogDescription>
            Espera un momento. El servidor puede tardar un poco en responder mientras activa la
            aplicacion.
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
