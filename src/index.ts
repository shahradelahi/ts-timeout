import { MAX_TIMEOUT, type Timeout } from './typings';

// Brand symbol to identify our timeout/interval objects
// Use Symbol.for to ensure cross-copy compatibility (monorepos, hoisted deps, etc.)
const brandSymbol = Symbol.for('@se-oss/timeout#brand');

type TimeoutWithBrand = Timeout & {
  [brandSymbol]: true;
  _cleared: boolean;
  _targetTime?: number;
};

export function setTimeout<Arguments extends unknown[]>(
  callback: (...arguments_: Arguments) => void,
  delay?: number,
  ...arguments_: Arguments
): Timeout;
export function setTimeout<Arguments extends unknown[]>(
  callback: (...arguments_: Arguments) => void,
  delay?: number,
  options?: { signal?: AbortSignal },
  ...arguments_: Arguments
): Timeout;
export function setTimeout<Arguments extends unknown[]>(
  callback: (...args: Arguments) => void,
  delay?: number,
  ...args: (Arguments[number] | { signal?: AbortSignal } | undefined)[]
): Timeout {
  if (typeof callback !== 'function') {
    throw new TypeError('Expected callback to be a function');
  }

  let options: { signal?: AbortSignal } | undefined;
  const DONT_USE_THIS_VARIABLE_mostRecentArg: unknown = args.at(-1);
  if (
    typeof DONT_USE_THIS_VARIABLE_mostRecentArg === 'object' &&
    DONT_USE_THIS_VARIABLE_mostRecentArg !== null &&
    ('signal' in DONT_USE_THIS_VARIABLE_mostRecentArg ||
      Object.keys(DONT_USE_THIS_VARIABLE_mostRecentArg).length === 0)
  ) {
    options = args.pop() as { signal?: AbortSignal };
  }

  const newArgs = args as Arguments;

  const { signal } = options ?? {};

  if (signal?.aborted) {
    // Return a cleared timeout to avoid scheduling
    return {
      id: undefined,
      [brandSymbol]: true,
      cleared: true,
      ref() {
        return this;
      },
      unref() {
        return this;
      },
      remaining() {
        return 0;
      },
    };
  }

  const timeout = _setTimeout(callback, delay, ...newArgs);

  const abortListener = () => {
    clearTimeout(timeout);
  };

  signal?.addEventListener('abort', abortListener, { once: true });

  // To prevent memory leaks, remove the abort listener when the timeout fires
  const originalCallback = callback;
  callback = (...callbackArgs: Arguments) => {
    signal?.removeEventListener('abort', abortListener);
    originalCallback(...callbackArgs);
  };

  return timeout;
}

function _setTimeout<Arguments extends unknown[]>(
  callback: (...arguments_: Arguments) => void,
  delay?: number,
  ...arguments_: Arguments
): Timeout {
  delay = Number(delay ?? 0);

  let shouldUnref = false;
  const timeout: TimeoutWithBrand = {
    [brandSymbol]: true,
    id: undefined,
    _cleared: false,
    get cleared() {
      return this._cleared;
    },
    ref() {
      shouldUnref = false;
      this.id?.ref?.();
      return this;
    },
    unref() {
      shouldUnref = true;
      this.id?.unref?.();
      return this;
    },
    remaining() {
      if (this._cleared) {
        return 0;
      }
      // If _targetTime is not set, it's an infinite timeout
      if (this._targetTime === undefined) {
        return Number.POSITIVE_INFINITY;
      }
      return Math.max(0, this._targetTime - performance.now());
    },
  };

  if (delay > Number.MAX_SAFE_INTEGER) {
    return timeout;
  }

  if (!Number.isFinite(delay) || delay < 0) {
    delay = 0;
  }

  timeout._targetTime = performance.now() + delay;

  const schedule = (remainingDelay: number) => {
    if (timeout._cleared) {
      return;
    }

    if (remainingDelay <= MAX_TIMEOUT) {
      timeout.id = globalThis.setTimeout(() => {
        if (!timeout._cleared) {
          callback(...arguments_);
        }
      }, remainingDelay);
    } else {
      timeout.id = globalThis.setTimeout(() => {
        const now = performance.now();
        const remaining = Math.max(0, (timeout._targetTime ?? 0) - now);
        schedule(remaining);
      }, MAX_TIMEOUT);
    }

    if (shouldUnref) {
      timeout.id?.unref?.();
    }
  };

  schedule(delay);

  return timeout;
}

export function clearTimeout(timeout: Timeout | undefined | null): void {
  if (!timeout || typeof timeout !== 'object' || !(brandSymbol in timeout)) {
    return;
  }

  const timeoutWithBrand = timeout as TimeoutWithBrand;
  timeoutWithBrand._cleared = true;

  if (timeoutWithBrand.id !== undefined) {
    globalThis.clearTimeout(timeoutWithBrand.id);
    timeoutWithBrand.id = undefined;
  }
}

export function setInterval<Arguments extends unknown[]>(
  callback: (...arguments_: Arguments) => void,
  delay?: number,
  ...arguments_: Arguments
): Timeout {
  if (typeof callback !== 'function') {
    throw new TypeError('Expected callback to be a function');
  }

  delay = Number(delay ?? 0);

  let shouldUnref = false;
  let nextTargetTime: number;

  const interval: TimeoutWithBrand = {
    [brandSymbol]: true,
    id: undefined,
    _cleared: false,
    get cleared() {
      return this._cleared;
    },
    ref() {
      shouldUnref = false;
      this.id?.ref?.();
      return this;
    },
    unref() {
      shouldUnref = true;
      this.id?.unref?.();
      return this;
    },
    remaining() {
      if (this._cleared) {
        return 0;
      }
      if (!Number.isFinite(nextTargetTime)) {
        return Number.POSITIVE_INFINITY;
      }
      return Math.max(0, nextTargetTime - performance.now());
    },
  };

  if (delay > Number.MAX_SAFE_INTEGER) {
    nextTargetTime = Number.POSITIVE_INFINITY;
    return interval;
  }

  if (!Number.isFinite(delay) || delay < 0) {
    delay = 0;
  }

  nextTargetTime = performance.now() + delay;

  const schedule = (remainingDelay: number) => {
    if (interval._cleared) {
      return;
    }

    if (remainingDelay <= MAX_TIMEOUT) {
      interval.id = globalThis.setTimeout(() => {
        if (interval._cleared) {
          return;
        }

        nextTargetTime += delay;
        const now = performance.now();
        const nextDelay = Math.max(0, nextTargetTime - now);
        schedule(nextDelay);

        callback(...arguments_);
      }, remainingDelay);
    } else {
      interval.id = globalThis.setTimeout(() => {
        const now = performance.now();
        const nextDelay = Math.max(0, nextTargetTime - now);
        schedule(nextDelay);
      }, MAX_TIMEOUT);
    }
    if (shouldUnref) {
      interval.id?.unref?.();
    }
  };

  schedule(delay);

  return interval;
}

export function clearInterval(interval: Timeout | undefined | null): void {
  clearTimeout(interval);
}

export { MAX_TIMEOUT };

/**
An error thrown when an operation is aborted.
*/
export class AbortError extends Error {
  constructor(message?: string) {
    super(message ?? 'The operation was aborted.');
    this.name = 'AbortError';
  }
}

export function delay(ms: number, { signal }: { signal?: AbortSignal } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new AbortError());
    }

    const timeout = setTimeout(() => {
      resolve();
      signal?.removeEventListener('abort', abortListener);
    }, ms);

    const abortListener = () => {
      clearTimeout(timeout);
      reject(new AbortError());
    };

    signal?.addEventListener('abort', abortListener, { once: true });
  });
}
