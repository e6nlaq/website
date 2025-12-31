"use client";

import { Button } from "@/components/ui/button";
import { SpinningText } from "@/components/ui/spinning-text";
import { useConfirm } from "@/hooks/useConfirm";

export default function Wind() {
    const confirm = useConfirm();
    return (
        <div className="flex flex-col items-center justify-center *:py-4">
            <p className="text-7xl ">Welcome, wind!!</p>
            <p>隠し部屋だよ</p>

            <Button
                onClick={async () => {
                    const res = await confirm({
                        title: "弦、そう、Welcome",
                        description:
                            "wind, are you serious????????????????????????????",
                        ok: "対",
                        cancel: "不h",
                    });
                    alert(res);
                }}
            >
                aaaa
            </Button>
            <SpinningText>Wnidddd, wwindiwjeifwjjk</SpinningText>
        </div>
    );
}
