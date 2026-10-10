import { solve, type Mode } from "./solve";

export type WorkerRequest = {
  values: bigint[];
  mod: bigint;
  limit: bigint;
  mode: Mode;
};

export type WorkerResponse =
  | { type: "result"; index: number; result: bigint | undefined }
  | { type: "done" };

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
};

workerScope.onmessage = async ({ data }) => {
  for (let index = 0; index < data.values.length; index++) {
    const result = solve(data.values[index], data.mod, data.limit, data.mode);
    workerScope.postMessage({ type: "result", index, result });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  workerScope.postMessage({ type: "done" });
};
