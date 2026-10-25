"use client";

import { DownloadIcon, ShareIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  getInstallPromptState,
  getServerInstallPromptState,
  promptInstall,
  subscribeInstallPrompt,
} from "@/lib/install-prompt";

export function InstallButton() {
  const { canInstall, isInstalled, isIos } = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptState,
    getServerInstallPromptState
  );
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (isInstalled || (!canInstall && !isIos)) return null;

  const handleInstall = async () => {
    if (!canInstall) {
      setShowIosHelp(true);
      return;
    }

    const outcome = await promptInstall();
    if (outcome !== "unavailable") return;

    if (isIos) {
      setShowIosHelp(true);
    } else {
      toast.info(
        "ブラウザのメニューから「アプリをインストール」を選んでください。"
      );
    }
  };

  return (
    <>
      <Button variant="outline" onClick={handleInstall}>
        <DownloadIcon data-icon="inline-start" />
        Install
      </Button>

      <AlertDialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <ShareIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>ホーム画面に追加</AlertDialogTitle>
            <AlertDialogDescription>
              ブラウザの共有ボタンから「ホーム画面に追加」を選ぶと、アプリのように起動できます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>閉じる</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
