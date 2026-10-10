"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircleQuestionMarkIcon, LucideIcon } from "lucide-react";
import { cn } from "cn";

type ConfirmOptions = {
  title?: string | ReactNode;
  description?: string | ReactNode;
  ok?: string | ReactNode;
  cancel?: string | ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "destructive";
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
    null
  );
  const isDestructive = options.variant === "destructive";

  const confirm = (options: ConfirmOptions) => {
    setOptions(options);
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleCancel = () => {
    setOpen(false);
    resolver?.(false);
  };

  const handleConfirm = () => {
    setOpen(false);
    resolver?.(true);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AlertDialog open={open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia
              className={cn(
                isDestructive &&
                  "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive"
              )}
            >
              {options.icon ? <options.icon /> : <CircleQuestionMarkIcon />}
            </AlertDialogMedia>
            <AlertDialogTitle>{options.title ?? "確認"}</AlertDialogTitle>
            <AlertDialogDescription>
              {options.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancel ?? "キャンセル"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              variant={options.variant}
            >
              {options.ok ?? "OK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx)
    throw new Error("useConfirm must be used inside ConfirmDialogProvider");
  return ctx.confirm;
}
