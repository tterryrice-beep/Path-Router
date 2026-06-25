import { sleep } from "../utils";

type Step = () => Promise<void>;

export interface SequenceConfig<T extends string> {
  steps: Step[];
  next?: T;
  onStart?: () => void;
  onFinish?: () => void;
  onDebug?: () => void;
  onError?: (error: any) => void;
}

export class SequenceRunner<T extends string> {
  private activeId = 0;
  private currentStepName = "" as T;

  constructor(private sequences: Record<T, SequenceConfig<T>>) {}

  play = async (key: T, withDebug = false) => {
    const id = ++this.activeId;
    const seq = this.sequences[key];
    this.currentStepName = key;

    seq.onStart?.();

    for (const step of seq.steps) {
      if (id !== this.activeId) return;
      const start = Date.now();

      try {
        await step();
      } catch (error) {
        console.error(" ‼️⚠️ SequenceRunner error! ", { error, key });
        seq.onError?.(error);
        if (withDebug) {
          debugger;
          seq.onDebug?.();
        }
      }

      const end = Date.now();
      const diff = end - start;

      // if returned the same time it means that the step was not async
      if (diff < 5) await sleep(0.05);
    }

    if (id !== this.activeId) return;

    seq.onFinish?.();

    if (seq.next) {
      this.play(seq.next);
    }
  };

  cancel = () => {
    this.activeId++;
  };

  getCurrentStepName = () => this.currentStepName;
}
