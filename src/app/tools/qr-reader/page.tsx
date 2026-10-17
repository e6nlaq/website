"use client";

import {
  ClipboardIcon,
  CopyIcon,
  FileImageIcon,
  ScanLineIcon,
  SquareArrowOutUpRightIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { QrReadResult } from "./decode";
import { readQrFromBlob } from "./decode";

const imageInputId = "qr-reader-image-input";

export default function QrReader() {
  const [preview, setPreview] = useState<{
    src: string;
    width: number;
    height: number;
  } | null>(null);
  const [result, setResult] = useState<QrReadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setPreview(null);
    setResult(null);
    toast.success("リセットしました");
  }, []);

  const handleBlob = useCallback(
    async (blob: Blob) => {
      if (loading) return;
      if (!blob.type.startsWith("image/")) {
        toast.error("画像以外のデータは読み取れません");
        return;
      }
      setLoading(true);
      try {
        const read = await readQrFromBlob(blob);
        setPreview({
          src: read.preview,
          width: read.previewWidth,
          height: read.previewHeight,
        });
        if (read.found) {
          setResult(read);
          toast.success("QRコードを読み取りました");
        } else {
          setResult(null);
          toast.error("QRコードが見つかりませんでした", {
            description: "別の画像でお試しください",
          });
        }
      } catch {
        toast.error("画像を読み込めませんでした");
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // ペースト(Ctrl+V)でクリップボードの画像を直接読み取る
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find(
        (candidate) => candidate.type.startsWith("image/")
      );
      if (!item) return;
      const file = item.getAsFile();
      if (file) {
        event.preventDefault();
        void handleBlob(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleBlob]);

  const readFromClipboard = useCallback(() => {
    navigator.clipboard
      .read()
      .then((items) => {
        const item = items.find((candidate) =>
          candidate.types.some((type) => type.startsWith("image/"))
        );
        if (!item) {
          toast.error("クリップボードに画像がありません", {
            description: "画像をコピーしてからお試しください",
          });
          return undefined;
        }
        const type = item.types.find((candidate) =>
          candidate.startsWith("image/")
        );
        if (!type) return undefined;
        return item.getType(type).then((blob) => handleBlob(blob));
      })
      .catch(() => {
        toast.error("クリップボードの内容を取得できませんでした", {
          description: "ブラウザの権限を確認してください",
        });
      });
  }, [handleBlob]);

  const copyResult = useCallback(() => {
    if (!result) return;
    navigator.clipboard
      .writeText(result.data)
      .then(() => toast.success("コピーしました"))
      .catch(() => {
        toast.error("コピーできませんでした", {
          description: "ブラウザの権限を確認してください",
        });
      });
  }, [result]);

  const isUrl = result ? /^https?:\/\//i.test(result.data) : false;
  const notFound = preview !== null && result === null && !loading;

  return (
    <div className="flex flex-col items-center justify-center gap-y-8 max-w-full">
      <ToolCard
        title="QR Reader"
        description={
          <>
            <p>画像からQRコードを読み取ります。</p>
            <p>画像はサーバーに送信されず、すべてブラウザ内で処理されます。</p>
          </>
        }
        onReset={reset}
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <FileImageIcon data-icon="inline-start" />
              ファイルを選択
            </Button>
            <Button
              variant="outline"
              onClick={readFromClipboard}
              disabled={loading}
            >
              <ClipboardIcon data-icon="inline-start" />
              クリップボードから読み取り
            </Button>
            {loading && (
              <span className="flex items-center gap-x-2 text-sm text-muted-foreground">
                <Spinner />
                読み取り中...
              </span>
            )}
          </div>
        }
      >
        <FieldGroup>
          <Field data-invalid={notFound}>
            <FieldLabel htmlFor={imageInputId}>読み取りたい画像</FieldLabel>
            <button
              type="button"
              id={imageInputId}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) void handleBlob(file);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-y-4 rounded-4xl border-2 border-dashed p-8 transition-colors",
                dragging ? "border-ring bg-muted" : "hover:bg-muted"
              )}
            >
              {preview ? (
                <Image
                  src={preview.src}
                  alt="読み取るQRコードを含む画像"
                  width={preview.width}
                  height={preview.height}
                  unoptimized
                  className="max-h-48 w-auto rounded-2xl"
                />
              ) : (
                <>
                  <ScanLineIcon className="size-10 text-muted-foreground" />
                  <span className="text-sm">クリックして画像を選択</span>
                  <span className="text-center text-xs text-muted-foreground">
                    コピーした画像を「Ctrl+V」で直接貼り付けることもできます
                  </span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleBlob(file);
                event.target.value = "";
              }}
            />
            <FieldDescription>
              ドラッグ&ドロップにも対応しています
            </FieldDescription>
            {notFound && (
              <p className="text-sm text-destructive">
                この画像からQRコードを読み取れませんでした。鮮明な画像でお試しください。
              </p>
            )}
          </Field>
        </FieldGroup>
      </ToolCard>

      {result && (
        <ToolCard
          title="読み取り結果"
          description={
            result.version > 0
              ? `QRコード バージョン ${result.version}`
              : undefined
          }
          footer={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={copyResult}>
                <CopyIcon data-icon="inline-start" />
                コピー
              </Button>
              {isUrl && (
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={
                    <a
                      href={result.data}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <SquareArrowOutUpRightIcon data-icon="inline-start" />
                  リンクを開く
                </Button>
              )}
            </div>
          }
        >
          <FieldGroup>
            <Field>
              <FieldLabel>読み取ったデータ</FieldLabel>
              <p className="min-w-0 rounded-2xl bg-muted/50 px-4 py-2 font-code text-sm break-all whitespace-pre-wrap">
                {result.data}
              </p>
            </Field>
          </FieldGroup>
        </ToolCard>
      )}

      <p className="text-center text-xs text-muted-foreground">
        「QRコード」は株式会社デンソーウェーブの登録商標です。
      </p>
    </div>
  );
}
