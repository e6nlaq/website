import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col gap-4 justify-center items-center">
            <h1 className="text-9xl font-bold">404</h1>

            <div className="flex gap-4">
                <Button asChild variant="outline">
                    <Link href="/">Home</Link>
                </Button>
            </div>
        </div>
    );
}
