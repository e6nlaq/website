import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4 justify-center items-center">
      <h1 className="text-9xl font-bold">404</h1>

      <div className="flex gap-4">
        <Link href="/" className={cn(buttonVariants())}>
          Home
        </Link>
      </div>
    </div>
  );
}
