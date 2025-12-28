"use client";

import { useEffect, useState } from "react";
import { WordRotate } from "@/components/ui/word-rotate";

export default function Greet() {
    const [words, setWords] = useState<string[]>(["Hello"]);

    useEffect(() => {
        const hour = new Date().getHours();
        let timeSpecificWords: string[];

        if (hour >= 5 && hour < 12) {
            // Morning
            timeSpecificWords = [
                "Good Morning",
                "おはようございます",
                "早上好",
                "좋은 아침",
                "สวัสดีตอนเช้า",
            ];
        } else if (hour >= 12 && hour < 18) {
            // Afternoon / Day
            timeSpecificWords = [
                "Hello",
                "こんにちは",
                "你好",
                "안녕하세요",
                "สวัสดี",
            ];
        } else {
            // Evening / Night
            timeSpecificWords = [
                "Good Evening",
                "こんばんは",
                "晚上好",
                "안녕하세요",
                "สวัสดีตอนเย็น",
            ];
        }
        setWords(timeSpecificWords);
    }, []);

    return (
        <WordRotate
            className="text-xl font-bold"
            words={words}
            duration={2000}
        />
    );
}
