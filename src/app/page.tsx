import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SpinningText } from "@/components/ui/spinning-text";
import Accounts from "./_index/accounts";
import { InstallButton } from "./_index/install-button";
import { cn } from "cn";

const Greet = dynamic(() => import("./_index/greet"));

export default function Page() {
  return (
    <div className="flex flex-col justify-center items-center gap-8">
      <div className="relative flex items-center justify-center w-48 h-48">
        <SpinningText duration={10} reverse={false} radius={5.5}>
          e6nlaq • e6nlaq • e6nlaq •
        </SpinningText>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image
            src="/icon.svg"
            width={48}
            height={48}
            className="size-18"
            alt=""
            priority
          />
        </div>
      </div>

      <Greet />
      <Accounts />

      <div className="flex flex-wrap justify-center gap-4 mt-4">
        <Link href="/about" className={cn(buttonVariants())}>
          About
        </Link>
        <Link href="/tools" className={cn(buttonVariants())}>
          Tools
        </Link>
        <InstallButton />
      </div>
    </div>
  );
}
