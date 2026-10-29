"use client";

import {
  EyeIcon,
  EyeOffIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoveDiagonal2Icon,
  SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  moveSheetRect,
  resizeSheetRect,
  scaleSheetRect,
  type SheetRect,
} from "./sheet";

const SHEET_HANDLE_ATTRIBUTE = "data-sheet-handle";
/** キーボードで大きさを変えるときの1回あたりの変化量 */
const KEYBOARD_RESIZE_STEP = 0.02;
const KEYBOARD_RESIZE_STEP_LARGE = 0.1;

interface Gesture {
  pointers: Map<number, { x: number; y: number }>;
  mode: "move" | "resize" | "pinch";
  startRect: SheetRect;
  startX: number;
  startY: number;
  startDistance: number;
  frame: DOMRect;
}

interface SheetViewerProps {
  photo: { url: string; width: number; height: number };
  rect: SheetRect;
  onRectChange: (rect: SheetRect) => void;
  color: string;
  opacity: number;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSettings: () => void;
  /** 全画面の描画先(Drawer の portal 先にも使う) */
  containerRef: RefObject<HTMLDivElement | null>;
}

export function SheetViewer({
  photo,
  rect,
  onRectChange,
  color,
  opacity,
  visible,
  onVisibleChange,
  fullscreen,
  onToggleFullscreen,
  onOpenSettings,
  containerRef,
}: SheetViewerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef(rect);
  const gestureRef = useRef<Gesture | null>(null);

  useEffect(() => {
    rectRef.current = rect;
  }, [rect]);

  const updateRect = useCallback(
    (next: SheetRect) => {
      rectRef.current = next;
      onRectChange(next);
    },
    [onRectChange]
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const frameElement = frameRef.current;
    if (!frameElement) return;
    const frame = frameElement.getBoundingClientRect();
    if (frame.width === 0 || frame.height === 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = { x: event.clientX, y: event.clientY };
    const gesture = gestureRef.current;
    if (!gesture) {
      const target = event.target as HTMLElement;
      gestureRef.current = {
        pointers: new Map([[event.pointerId, point]]),
        mode: target.closest(`[${SHEET_HANDLE_ATTRIBUTE}]`) ? "resize" : "move",
        startRect: rectRef.current,
        startX: event.clientX,
        startY: event.clientY,
        startDistance: 0,
        frame,
      };
      return;
    }
    gesture.pointers.set(event.pointerId, point);
    if (gesture.pointers.size === 2) {
      const [first, second] = Array.from(gesture.pointers.values());
      gesture.mode = "pinch";
      gesture.startRect = rectRef.current;
      gesture.startDistance = Math.max(
        1,
        Math.hypot(second.x - first.x, second.y - first.y)
      );
      gesture.frame = frame;
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || !gesture.pointers.has(event.pointerId)) return;
    gesture.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (gesture.mode === "pinch" && gesture.pointers.size >= 2) {
      const [first, second] = Array.from(gesture.pointers.values());
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      updateRect(
        scaleSheetRect(gesture.startRect, distance / gesture.startDistance)
      );
      return;
    }
    const dx = (event.clientX - gesture.startX) / gesture.frame.width;
    const dy = (event.clientY - gesture.startY) / gesture.frame.height;
    updateRect(
      gesture.mode === "resize"
        ? resizeSheetRect(gesture.startRect, dx, dy)
        : moveSheetRect(gesture.startRect, dx, dy)
    );
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    gesture.pointers.delete(event.pointerId);
    if (gesture.pointers.size === 0) {
      gestureRef.current = null;
      return;
    }
    // ピンチの途中で片方の指が離れたら、残った指で移動を続ける
    const [remaining] = Array.from(gesture.pointers.values());
    gesture.mode = "move";
    gesture.startRect = rectRef.current;
    gesture.startX = remaining.x;
    gesture.startY = remaining.y;
    gesture.startDistance = 0;
  };

  const handleResizeKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) => {
    const step = event.shiftKey
      ? KEYBOARD_RESIZE_STEP_LARGE
      : KEYBOARD_RESIZE_STEP;
    let dx = 0;
    let dy = 0;
    switch (event.key) {
      case "ArrowRight":
        dx = step;
        break;
      case "ArrowLeft":
        dx = -step;
        break;
      case "ArrowDown":
        dy = step;
        break;
      case "ArrowUp":
        dy = -step;
        break;
      default:
        return;
    }
    event.preventDefault();
    updateRect(resizeSheetRect(rectRef.current, dx, dy));
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex w-full flex-col items-center gap-3",
        fullscreen &&
          "fixed inset-0 z-[60] justify-center gap-0 overflow-hidden bg-black p-3"
      )}
    >
      <div ref={frameRef} className="relative isolate max-w-full">
        <Image
          src={photo.url}
          alt="撮影した写真"
          width={photo.width}
          height={photo.height}
          unoptimized
          draggable={false}
          className={cn(
            "block h-auto w-auto max-w-full select-none object-contain",
            fullscreen ? "max-h-[calc(100svh-4rem)]" : "max-h-[60svh]"
          )}
        />
        {visible && (
          <div
            role="group"
            aria-label="赤シート"
            className="absolute cursor-grab touch-none select-none active:cursor-grabbing"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.width * 100}%`,
              height: `${rect.height * 100}%`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-[2px]"
              style={{
                backgroundColor: color,
                opacity,
                mixBlendMode: "multiply",
              }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-[2px] ring-1 ring-white/70 ring-inset" />
            <button
              type="button"
              data-sheet-handle=""
              aria-label="シートの大きさを変える"
              className="absolute -right-3 -bottom-3 flex size-7 touch-none items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onKeyDown={handleResizeKeyDown}
            >
              <MoveDiagonal2Icon className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex w-full items-center justify-between gap-2",
          fullscreen &&
            "pointer-events-none absolute inset-x-0 bottom-0 items-end p-3"
        )}
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon-lg"
            className="shadow-md"
            aria-label="シートの設定"
            onClick={onOpenSettings}
          >
            <SettingsIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant={visible ? "secondary" : "outline"}
            size="icon-lg"
            className="shadow-md"
            aria-label={visible ? "シートを隠す" : "シートを表示"}
            aria-pressed={visible}
            onClick={() => onVisibleChange(!visible)}
          >
            {visible ? (
              <EyeOffIcon aria-hidden="true" />
            ) : (
              <EyeIcon aria-hidden="true" />
            )}
          </Button>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon-lg"
          className="pointer-events-auto shadow-md"
          aria-label={fullscreen ? "全画面を解除" : "全画面で表示"}
          onClick={onToggleFullscreen}
        >
          {fullscreen ? (
            <MinimizeIcon aria-hidden="true" />
          ) : (
            <MaximizeIcon aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
