import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Target,
  Circle
} from "lucide-react";
import { label, ProjectStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProjectProgressionProps {
  steps: ProjectStatus[];
  currentStatus: string;
}

export function ProjectProgression({ steps, currentStatus }: ProjectProgressionProps) {
  const currentIndex = steps.indexOf(currentStatus as ProjectStatus);

  return (
    <div className="relative py-12 px-4">
      <div className="absolute left-8 right-8 top-1/2 h-0.5 -translate-y-1/2 bg-border sm:left-12 sm:right-12" />
      
      <div className="relative flex justify-between">
        {steps.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={status} className="flex flex-col items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full border-2 transition-all sm:size-10",
                  isCompleted && "border-primary bg-primary text-primary-foreground shadow-lg",
                  isCurrent && "size-10 border-primary bg-background text-primary shadow-xl ring-4 sm:size-12",
                  isFuture && "border-muted bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 size={18} />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Target size={20} />
                  </motion.div>
                ) : (
                  <Circle size={14} className="opacity-20" />
                )}
                
                {isCurrent && (
                  <span className="absolute -top-7 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-primary">
                    Etapa Atual
                  </span>
                )}
              </motion.div>
              
              <div className="flex flex-col items-center text-center">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tight sm:text-xs",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {label(status)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
