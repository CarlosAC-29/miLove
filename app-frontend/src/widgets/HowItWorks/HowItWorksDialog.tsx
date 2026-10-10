import { CalendarDays, CircleDollarSign, HeartHandshake, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface HowItWorksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    title: "Organicen lo cotidiano",
    description: "Guarden citas, regalos, películas, restaurantes y deseos.",
    icon: HeartHandshake
  },
  {
    title: "Planeen juntos",
    description: "El calendario reúne las citas y los planes para consultarlos por día.",
    icon: CalendarDays
  },
  {
    title: "Lleven sus finanzas",
    description: "Registren ingresos, gastos, presupuestos y metas para ver el estado del mes.",
    icon: CircleDollarSign
  },
  {
    title: "Encuentren nuevas ideas",
    description: "Exploren sugerencias para descubrir actividades y guardarlas.",
    icon: Lightbulb
  }
] as const;

export function HowItWorksDialog({ open, onOpenChange }: HowItWorksDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cómo funciona MiLove</DialogTitle>
          <DialogDescription>
            Todo lo importante para organizarse y disfrutar juntos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {STEPS.map(({ title, description, icon: Icon }, index) => (
            <div
              key={title}
              className="flex gap-3 rounded-xl border border-border/70 bg-surface p-3"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {index + 1}. {title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          En modo demo, los cambios se guardan solo en este dispositivo.
        </p>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
