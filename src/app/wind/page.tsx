"use client";

import useSWR, { type Fetcher } from "swr";
import { Button } from "@/components/ui/button";

const fetcher: Fetcher<string, string> = (url) =>
    fetch(url).then((res) => res.text());

export default function Wind() {
    const { data: text, error } = useSWR<string>("/next.svaag", fetcher);
    console.log(error);
    // useEffect(() => {

    // 	(async () => {
    // 		const ref = await fetch("/file.svg");

    // 		setText(await ref.text());
    // 	})();
    // }, []);

    return (
        <div className="flex flex-col items-center justify-center *:py-4">
            <p className="text-7xl ">Welcome, wind!!</p>
            <p>隠し部屋だよ</p>

            <Button
                onClick={() => {
                    alert("winddd");
                }}
            >
                aaaa
            </Button>

            <p>{text}</p>
            <p>{error}</p>
        </div>
    );
}
