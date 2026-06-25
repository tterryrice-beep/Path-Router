import { EventEmitter } from "events";

export type SetterMap<State, Events> = {
  [K in keyof Events]: (state: State, value: Events[K]) => void;
};

export abstract class StorageManager<
  StateValues,
  Events extends Record<string, any>,
> {
  protected emitter = new EventEmitter();
  protected state: StateValues;
  protected isDestroyed = false;

  public readonly setters: {
    [K in keyof Events]: (value: Events[K]) => void;
  };

  constructor(
    initialState: StateValues,
    setters: SetterMap<StateValues, Events>,
    config?: {
      maxListeners?: number;
    },
  ) {
    this.state = initialState;

    this.setters = Object.fromEntries(
      Object.entries(setters).map(([key, fn]) => [
        key,
        (value: any) => {
          const result = fn(this.state, value);
          this.emitter.emit(key, result || value);
        },
      ]),
    ) as {
      [K in keyof Events]: (value: Events[K]) => void;
    };

    if (config) {
      const { maxListeners } = config;
      if (maxListeners) this.emitter.setMaxListeners(maxListeners);
    }
  }

  public getValue<T>(selector: (state: StateValues) => T): T {
    return selector(this.state);
  }

  public listen<K extends keyof Events>(
    key: K,
    cb: (value: Events[K]) => void,
  ): () => void {
    this.emitter.addListener(key as string, cb);
    return () => this.emitter.removeListener(key as string, cb);
  }

  protected destroy() {
    this.emitter.removeAllListeners();
    this.emitter.setMaxListeners(0);
    this.isDestroyed = true;
  }
}
