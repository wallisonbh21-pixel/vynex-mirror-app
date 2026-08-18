import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { LucideIcon } from "lucide-react";

interface SubmenuItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

interface SidebarSubmenuProps {
  items: SubmenuItem[];
  pathname: string;
  isOpen: boolean;
}

export function SidebarSubmenu({ items, pathname, isOpen }: SidebarSubmenuProps) {
  return (
    <div
      className={cn(
        "grid overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
      )}
    >
      <div className="overflow-hidden flex flex-col gap-1 pl-9 pr-2">
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg px-3 py-2 text-xs transition-colors",
                active
                  ? "bg-sidebar-accent/50 text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <item.icon className={cn("size-3", active && "text-primary")} aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.description && (
                <span className="text-[10px] text-muted-foreground/70 pl-5">
                  {item.description}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
