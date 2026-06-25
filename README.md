# facilitators-tr

## Managers

> Inherited classes to simplify work.

### StorageManager

#### What the flark is this?

In many apps you end up writing the same pattern over and over:

- you keep some piece of state (settings, UI flags, form values, game state, etc.);
- you need to **mutate** that state through a fixed set of well-defined actions;
- you need other parts of the app to **react** to those mutations (re-render, recalculate, log, etc.);
- and you want all of this to be **fully typed**, so that action names and payload types can't drift apart.

`StorageManager` packs all of that into one abstract class:

- it owns a single `state` object (private — not writable from outside);
- it generates **typed setters** from a map you provide — each setter mutates the state and emits an event with the same name;
- it gives you a typed `listen(event, cb)` method to subscribe to those events and an unsubscribe function in return;
- it is built on top of Node's `EventEmitter`, so you don't have to manage listener lists yourself.

#### How to use

  1. Install and import:

    ```ts
    import { StorageManager, SetterMap } from "facilitators-tr";
    ```

  2. Describe your state and the events your store will emit:

    ```ts
    type State = {
        userName: string;
        userAge: number;
        isAdmin: boolean;
        bornYear?: number;
        
    };

    type Events = {
      userName: string;
      userAge: number;
      isAdmin: boolean;
    };
    ```

  3. Provide initial state and a setter map. Each setter receives the current `state` and the new `value`. Mutate the state in place. If you `return` something, listeners will receive the returned value; otherwise they receive the original `value`.

    ```ts
    const INITIAL_STATE: State = {
      userName: "",
      userAge: 0,
      isAdmin: false,
    };

    const SETTERS: SetterMap<State, Events> = {
      userName(state, value) {
        state.userName = value;
      },
      userAge(state, value) {
        state.userAge = value;
        return {
          age: value,
          bornYear: new Date().getFullYear() - value,
        };
      },
      isAdmin(state, value) {
        state.isAdmin = value;
      },
    };
    ```

  4. Extend `StorageManager` to create your concrete manager:

    ```ts
    class UserManager extends StorageManager<State, Events> {
      constructor() {
        super(INITIAL_STATE, SETTERS, { maxListeners: 50 });
      }
    }

    const user = new UserManager();
    ```

  5. Use it. Setters are auto-generated from the keys of your events type and are fully typed:

    ```ts
    const manager = useRef(new UserManager());
    const [name, setName] = useState(manager.current.getValue("userName"));
    const [age, setAge] = useState(manager.current.getValue("userAge"));
    const [isAdmin, setIsAdmin] = useState(manager.current.getValue("isAdmin"));
    const [bornYear, setBornYear] = useState(manager.current.getValue("bornYear"));

    useEffect(() => {
        const unsubscribeName = manager.current.listen('userName', setName);
        const unsubscribeAge = manager.current.listen("userAge", ({age, bornYear}) => {
            setAge(age);
            setBornYear(bornYear);
        });
        return () => {
            unsubscribeName();
            unsubscribeAge();
            manager.current.destroy();
        };
    }, []);

    const onNameChange = (name: string) => {
        manager.current.setters.userName(name);
    };

    const onAgeChange = (age: number) => {
        manager.current.setters.userAge(age);
    };
    ```

#### API

- **`new StorageManager(initialState, setters, config?)`** — constructor used from your subclass. `config.maxListeners` lets you raise the `EventEmitter` listener cap.
- **`getValue(selector)`** — read-only access to state via a selector. E.g. `manager.getValue(s => s.userName)`. Prevents direct writes to state from outside the manager.
- **`setters[event](value)`** — auto-generated, typed setter for each key of your `Events` type. Calls your setter function and emits an event with the same name.
- **`listen(event, cb)`** — subscribe to an event. Returns a function that removes the listener.
- **`destroy()`** *(protected)* — removes all listeners and marks the manager as destroyed. Call it from your subclass when the manager is no longer needed.

---

### SequenceRunner

#### What the flark is this?

Sometimes you need to run a chain of async operations — animations, API calls, onboarding steps, tutorial flows — where:

- each step must complete before the next one starts;
- a new run should **cancel** any previously running chain without race conditions;
- certain sequences should **chain into each other** automatically on finish;
- you want lifecycle hooks (`onStart`, `onFinish`, `onError`) without wiring them manually every time.

`SequenceRunner` solves all of that. You describe a map of named sequences once, then call `play(key)` whenever you need one. Any previously running sequence is safely abandoned at the next step boundary.

#### How to use

  1. Install and import:

    ```ts
    import { SequenceRunner, SequenceConfig } from "facilitators-tr";
    ```

  2. Define the names of your sequences as a union type and describe each one with `SequenceConfig`:

    ```ts
    type Steps = "intro" | "main" | "outro";

    const sequences: Record<Steps, SequenceConfig<Steps>> = {
      intro: {
        steps: [
          async () => { await fadeIn(); },
          async () => { await showLogo(); },
        ],
        next: "main",
        onStart: () => console.log("intro started"),
        onFinish: () => console.log("intro finished"),
        onError: (err) => console.error("intro error", err),
      },
      main: {
        steps: [
          async () => { await loadData(); },
          async () => { await renderDashboard(); },
        ],
        onFinish: () => console.log("main finished"),
      },
      outro: {
        steps: [
          async () => { await fadeOut(); },
        ],
      },
    };
    ```

  3. Create the runner and start a sequence:

    ```ts
    const runner = new SequenceRunner(sequences);

    runner.play("intro");
    ```

    `intro` will run its steps in order, then automatically chain into `main` via `next`.

  4. Cancel a running sequence at any point:

    ```ts
    runner.cancel();
    ```

    The current step will finish (you can't interrupt mid-`await`), but no further steps — and no `onFinish` or `next` — will execute.

  5. Enable debug mode to pause on errors:

    ```ts
    runner.play("main", true);
    ```

    When `withDebug` is `true`, a step error will trigger the browser `debugger` statement and call `onDebug` before continuing.

#### How it works under the hood

- Every call to `play()` increments an internal `activeId` counter and captures its current value. Before executing each step and before calling `onFinish` / `next`, the runner checks whether `activeId` has changed. If it has, the sequence silently stops — no race conditions, no cleanup needed.
- If a step resolves in under 5 ms (i.e. it is effectively synchronous), the runner inserts a 50 ms `sleep` to yield back to the event loop and avoid UI freezes.

#### API

- **`new SequenceRunner(sequences)`** — accepts a `Record<T, SequenceConfig<T>>` where `T` is a string union of all sequence keys.
- **`play(key, withDebug?)`** — starts the named sequence. Cancels any previously running sequence. `withDebug = true` triggers `debugger` and `onDebug` on step errors.
- **`cancel()`** — stops the running sequence after the current step finishes. Safe to call at any time, even when nothing is running.
- **`getCurrentStepName()`** — returns the key of the sequence that was most recently started.

#### `SequenceConfig<T>` options

| Option | Type | Description |
| --- | --- | --- |
| `steps` | `Array<() => Promise<void>>` | Async functions executed in order. |
| `next` | `T` (optional) | Key of the sequence to auto-play after this one finishes. |
| `onStart` | `() => void` (optional) | Called once, before the first step runs. |
| `onFinish` | `() => void` (optional) | Called once, after the last step completes successfully. |
| `onError` | `(error: any) => void` (optional) | Called whenever a step throws. The sequence continues to the next step. |
| `onDebug` | `() => void` (optional) | Called after `onError` when `withDebug` mode is active. |
