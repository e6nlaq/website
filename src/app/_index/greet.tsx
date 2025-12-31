"use client";

import { useEffect, useState } from "react";
import { WordRotate } from "@/components/ui/word-rotate";

export default function Greet() {
    const [words, setWords] = useState<string[]>(["Hello"]);

    useEffect(() => {
        const date = new Date();
        const hour = date.getHours();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        let timeSpecificWords: string[];

        if (month === 1 && day === 1) {
            timeSpecificWords = [
                "Happy New Year!",
                "あけましておめでとうございます!",
                "新年快樂!",
                "새해 복 많이 받으세요!",
            ];
        } else if (month === 12 && day === 31 && hour >= 21) {
            timeSpecificWords = [
                "See you next year",
                "また来年",
                "明年见",
                "내년에 만나요",
            ];
        } else if (month === 12 && day === 25) {
            timeSpecificWords = [
                "Merry Christmas!",
                "メリークリスマス!",
                "聖誕快乐!",
                "메리 크리스마스!",
            ];
        } else if (month === 10 && day === 31) {
            timeSpecificWords = [
                "Happy Halloween!",
                "ハッピーハロウィン!",
                "萬聖節快樂!",
                "해피 할로윈!",
            ];
        } else if (hour >= 5 && hour < 10) {
            // Morning
            timeSpecificWords = [
                "Good Morning",
                "おはようございます",
                "早上好",
                "좋은 아침",
            ];
        } else {
            // Evening / Night
            timeSpecificWords = [
                "Good Evening",
                "こんばんは",
                "晚上好",
                "안녕하세요",
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
