"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { SpinningText } from "@/components/ui/spinning-text";
import { useConfirm } from "@/hooks/useConfirm";

export default function Wind() {
  const confirm = useConfirm();

  const a = [
    { label: "a", value: "a" },
    { label: "BIE", value: "b" },
    { label: "WIN", value: "win" },
  ] satisfies { label: string; value: string }[];

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <p className="text-7xl ">Welcome, wind!!</p>
      <p>隠し部屋だよ</p>

      <Button
        onClick={async () => {
          const res = await confirm({
            title: "弦、そう、Welcome",
            description: "wind, are you serious????????????????????????????",
            ok: "対",
            cancel: "不h",
          });
          alert(res);
        }}
      >
        aaaa
      </Button>
      {/* <SpinningText>Wnidddd, wwindiwjeifwjjk</SpinningText> */}
      <Select items={a}>
        <SelectTrigger className="items-center justify-center">
          <SelectValue placeholder="Select"></SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {a.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
