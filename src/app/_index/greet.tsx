"use client";

import { useSyncExternalStore } from "react";

import { WordRotate } from "@/components/ui/word-rotate";

function getTimeSpecificWords(): string[] {
  const date = new Date();
  const hour = date.getHours();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 1 && day === 1) {
    return [
      "Happy New Year!",
      "あけましておめでとうございます!",
      "新年快樂!",
      "새해 복 많이 받으세요!",
    ];
  } else if (month === 12 && day === 31 && hour >= 21) {
    return ["See you next year", "また来年", "明年见", "내년에 만나요"];
  } else if (month === 12 && day === 25) {
    return [
      "Merry Christmas!",
      "メリークリスマス!",
      "聖誕快乐!",
      "메리 크리스마스!",
    ];
  } else if (month === 10 && day === 31) {
    return [
      "Happy Halloween!",
      "ハッピーハロウィン!",
      "萬聖節快樂!",
      "해피 할로윈!",
    ];
  } else if (hour >= 12 && hour < 18) {
    // Afternoon / Day
    return ["Hello", "こんにちは", "你好", "안녕하세요"];
  } else if (hour >= 5 && hour < 10) {
    // Morning
    return ["Good Morning", "おはようございます", "早上好", "좋은 아침"];
  } else {
    // Evening / Night
    return ["Good Evening", "こんばんは", "晚上好", "안녕하세요"];
  }
}

// 現在分のスナップショットをキャッシュ(getSnapshot の安定性を保証)
let cached: { key: number; words: string[] } | null = null;

function getSnapshot(): string[] {
  const key = new Date().getTime() / 60000;
  if (!cached || cached.key !== key) {
    cached = {
      key,
      words: getTimeSpecificWords(),
    };
  }
  return cached.words;
}

const subscribe = () => () => {};
// getServerSnapshot は毎回同じ参照を返す必要がある(配列はキャッシュして返す)
const SERVER_WORDS = ["Hello"];
const getServerSnapshot = () => SERVER_WORDS;

export default function Greet() {
  const words = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <WordRotate className="text-xl font-bold" words={words} duration={2000} />
  );
}
