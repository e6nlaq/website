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
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
    title?: string | ReactNode;
    description?: string | ReactNode;
    ok?: string | ReactNode;
    cancel?: string | ReactNode;
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
                        <AlertDialogTitle>
                            {options.title ?? "確認"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {options.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>
                            {options.cancel ?? "キャンセル"}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm}>
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
