import { describe, expect, test, vi } from 'vitest';

import {
  AbortError,
  clearInterval,
  clearTimeout,
  delay,
  MAX_TIMEOUT,
  setInterval,
  setTimeout,
} from './index.js';

describe('setTimeout', () => {
  test('basic timeout', async () => {
    const fn = vi.fn();
    setTimeout(fn, 10);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 50));
    expect(fn).toHaveBeenCalledOnce();
  });

  test('passes arguments to callback', async () => {
    const fn = vi.fn();
    setTimeout(fn, 10, 'hello', 42);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 50));
    expect(fn).toHaveBeenCalledWith('hello', 42);
  });

  test('can be cleared', async () => {
    const fn = vi.fn();
    const timeout = setTimeout(fn, 20);
    clearTimeout(timeout);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 50));
    expect(fn).not.toHaveBeenCalled();
    expect(timeout.cleared).toBe(true);
  });

  test('handles long delays', () => {
    const fn = vi.fn();
    const longDelay = MAX_TIMEOUT + 100;
    const timeout = setTimeout(fn, longDelay);
    expect(timeout).toBeDefined();
    clearTimeout(timeout);
  });

  test('throws on non-function callback', () => {
    expect(() => setTimeout(null as any, 10)).toThrow(TypeError);
  });
});

describe('setInterval', () => {
  test('basic interval', async () => {
    const fn = vi.fn();
    const interval = setInterval(fn, 10);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 55));
    clearInterval(interval);
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  test('can be cleared', async () => {
    const fn = vi.fn();
    const interval = setInterval(fn, 10);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 25));
    clearInterval(interval);
    const callCount = fn.mock.calls.length;
    await new Promise((resolve) => globalThis.setTimeout(resolve, 50));
    expect(fn.mock.calls.length).toBe(callCount);
    expect(interval.cleared).toBe(true);
  });
});

describe('delay', () => {
  test('resolves after a given time', async () => {
    const start = performance.now();
    await delay(50);
    const end = performance.now();
    expect(end - start).toBeGreaterThanOrEqual(45);
  });

  test('can be aborted', async () => {
    const controller = new AbortController();
    const promise = delay(100, { signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toThrow(AbortError);
  });

  test('rejects immediately if signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const promise = delay(100, { signal: controller.signal });
    await expect(promise).rejects.toThrow(AbortError);
  });
});

describe('setTimeout with AbortSignal', () => {
  test('aborts the timeout', async () => {
    const fn = vi.fn();
    const controller = new AbortController();
    setTimeout(fn, 50, { signal: controller.signal });
    controller.abort();
    await delay(100);
    expect(fn).not.toHaveBeenCalled();
  });

  test('does not schedule if already aborted', async () => {
    const fn = vi.fn();
    const controller = new AbortController();
    controller.abort();
    const timeout = setTimeout(fn, 50, { signal: controller.signal });
    await delay(100);
    expect(fn).not.toHaveBeenCalled();
    expect(timeout.cleared).toBe(true);
  });
});

describe('remaining() method', () => {
  test('returns remaining time for setTimeout', async () => {
    const timeout = setTimeout(() => {}, 100);
    await delay(20);
    const remaining = timeout.remaining();
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(80);
    clearTimeout(timeout);
    expect(timeout.remaining()).toBe(0);
  });

  test('returns remaining time for setInterval', async () => {
    const interval = setInterval(() => {}, 100);
    await delay(20);
    const remaining = interval.remaining();
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(80);
    await delay(85); // after first tick
    const remainingAfterTick = interval.remaining();
    expect(remainingAfterTick).toBeGreaterThan(80);
    clearInterval(interval);
    expect(interval.remaining()).toBe(0);
  });

  test('returns Infinity for infinite delays', () => {
    const timeout = setTimeout(() => {}, Number.POSITIVE_INFINITY);
    expect(timeout.remaining()).toBe(Number.POSITIVE_INFINITY);
    clearTimeout(timeout);
  });
});
