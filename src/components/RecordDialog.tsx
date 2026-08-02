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

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "email";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
};

export function RecordDialog({
  title,
  trigger,
  fields,
  initial,
  onSubmit,
}: {
  title: string;
  trigger: ReactNode;
  fields: Field[];
  initial?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    fields.forEach((field) => {
      const raw = initial?.[field.name];
      next[field.name] = raw === null || raw === undefined ? "" : String(raw);
    });
    setValues(next);
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const value = (values[field.name] ?? "").trim();
      if (field.required && !value) return;
      if (field.type === "number") payload[field.name] = value === "" ? 0 : Number(value);
      else payload[field.name] = value === "" ? null : value;
    }
    void onSubmit(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  maxLength={1000}
                  value={values[field.name] ?? ""}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                />
              ) : field.type === "select" ? (
                <Select
                  value={values[field.name] ?? ""}
                  onValueChange={(value) => setValues({ ...values, [field.name]: value })}
                >
                  <SelectTrigger id={field.name}>
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
                  value={values[field.name] ?? ""}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
