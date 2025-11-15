/**
 * Maximum safe timeout value for `setTimeout` in JavaScript (2^31-1 milliseconds).
 * This is approximately 24.8 days.
 */
export const MAX_TIMEOUT = 2_147_483_647;

/**
 * Cross-environment timer handle (works in both Node.js and browsers).
 */
export type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

/**
 * Timeout object that can be cleared.
 */
export type Timeout = {
  /**
   * The underlying timer ID.
   * @internal
   */
  id: TimerHandle | undefined;

  /**
   * A boolean indicating if the timer has been cleared.
   */
  readonly cleared: boolean;

  /**
   * Prevents the event loop from exiting while this timer is active (Node.js only; no-op in browsers).
   *
   * @returns The timeout object for chaining.
   */
  ref(): Timeout;

  /**
   * Allows the event loop to exit if this is the only active timer (Node.js only; no-op in browsers).
   *
   * @returns The timeout object for chaining.
   */
  unref(): Timeout;

  /**
   * Returns the number of milliseconds remaining until the timer is scheduled to execute.
   *
   * @returns The remaining time in milliseconds.
   */
  remaining(): number;

  /**
   * @internal
   */
  [key: symbol]: unknown;
};
