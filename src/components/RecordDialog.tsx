import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "email" | "hidden";
  options?: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  defaultValue?: string;
  onChange?: (value: string | number | null) => void;
};


export function RecordDialog({
  title,
  trigger,
  fields,
  initial,
  onSubmit,
  onOpenChange,
}: {
  title: string;
  trigger: ReactNode;
  fields: Field[];
  initial?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onOpenChange?: (open: boolean) => void;
}) {
  
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    const next: Record<string, string> = {};
    fields.forEach((field) => {
      const raw = field.defaultValue ?? initial?.[field.name];
      next[field.name] = raw === null || raw === undefined ? "" : String(raw);
    });
    setValues(next);
    setErrors({});

  }, [isOpen]);

  function setValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });

    // Handle field specific onChange
    const field = fields.find(f => f.name === name);
    if (field?.onChange) {
      if (field.type === "number") field.onChange(value === "" ? 0 : Number(value));
      else field.onChange(value === "" ? null : value);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload: Record<string, unknown> = {};
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      const value = (values[field.name] ?? "").trim();
      if (field.required && !value) {
        nextErrors[field.name] = `Preencha o campo "${field.label}".`;
        continue;
      }
      if (field.type === "number") payload[field.name] = value === "" ? 0 : Number(value);
      else payload[field.name] = value === "" ? null : value;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    void onSubmit(payload);
    if (!isControlled) setInternalOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
      if (!isControlled) setInternalOpen(val);
      onOpenChange?.(val);
    }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {fields.map((field) => {
            const error = errors[field.name];
            if (field.type === "hidden") {
              return <input key={field.name} type="hidden" name={field.name} value={values[field.name] ?? ""} />;
            }
            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required ? <span className="ml-1 text-destructive">*</span> : null}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    maxLength={1000}
                    aria-invalid={!!error}
                    className={cn(error && "border-destructive")}
                    disabled={field.disabled}
                    value={values[field.name] ?? ""}
                    onChange={(e) => setValue(field.name, e.target.value)}
                  />
                ) : field.type === "select" ? (
                  <Select
                    value={values[field.name] ?? ""}
                    onValueChange={(value) => setValue(field.name, value)}
                    disabled={field.disabled ?? false}

                  >
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={!!error}
                      className={cn("transition-colors", error && "border-destructive")}
                    >
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type ?? "text"}
                    maxLength={field.type === "number" ? undefined : 255}
                    placeholder={field.placeholder}
                    aria-invalid={!!error}
                    className={cn("transition-colors", error && "border-destructive")}
                    value={values[field.name] ?? ""}
                    disabled={field.disabled}
                    onChange={(e) => setValue(field.name, e.target.value)}
                  />
                )}
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Campos marcados com <span className="text-destructive">*</span> são obrigatórios.
          </p>
          <DialogFooter>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
