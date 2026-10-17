"use client";

import {
  createContext,
  use,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { cn } from "@/lib/utils";

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
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const isDestructive = options.variant === "destructive";

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      // 未解決の Promise が残っていれば先に解決してリークを防ぐ
      resolverRef.current?.(false);
      resolverRef.current = resolve;
    });
  }, []);

  const closeModal = useCallback((value: boolean) => {
    setOpen(false);
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  const handleCancel = useCallback(() => closeModal(false), [closeModal]);
  const handleConfirm = useCallback(() => closeModal(true), [closeModal]);

  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}

      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          // ESC・背景クリックなどの自身の外部から閉じられた場合も解決する
          if (!nextOpen) closeModal(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia
              className={cn(
                isDestructive && "bg-destructive/10 text-destructive"
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
  const ctx = use(ConfirmContext);
  if (!ctx)
    throw new Error("useConfirm must be used inside ConfirmDialogProvider");
  return ctx.confirm;
}
