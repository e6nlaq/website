"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface ToolCardProps {
    title: string;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;

    // Actions
    actionLabel?: string;
    loadingLabel?: string;
    loading?: boolean;
    onAction?: () => void;
    formId?: string;

    // Reset
    resetLabel?: string;
    onReset?: () => void;
}

export function ToolCard({
    title,
    description,
    children,
    footer,
    className,
    actionLabel = "計算",
    loadingLabel = "計算中...",
    loading = false,
    onAction,
    formId,
    resetLabel = "リセット",
    onReset,
}: ToolCardProps) {
    const hasActions = !!(onAction || formId || onReset);

    return (
        <Card className={cn("w-2xl max-w-full", className)}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>{children}</CardContent>
            {(hasActions || footer) && (
                <CardFooter className="flex-col items-start gap-y-4">
                    {hasActions && (
                        <Field orientation="horizontal">
                            {(onAction || formId) && (
                                <Button
                                    type={formId ? "submit" : "button"}
                                    form={formId}
                                    disabled={loading}
                                    onClick={onAction}
                                >
                                    {loading ? loadingLabel : actionLabel}
                                </Button>
                            )}
                            {onReset && (
                                <Button
                                    form={formId}
                                    type={formId ? "reset" : "button"}
                                    onClick={onReset}
                                    variant="outline"
                                >
                                    {resetLabel}
                                </Button>
                            )}
                        </Field>
                    )}
                    {footer}
                </CardFooter>
            )}
        </Card>
    );
}
