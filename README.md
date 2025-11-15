# @se-oss/timeout

[![CI](https://github.com/shahradelahi/ts-timeout/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/shahradelahi/ts-timeout/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/@se-oss/timeout.svg)](https://www.npmjs.com/package/@se-oss/timeout)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](/LICENSE)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@se-oss/timeout)
[![Install Size](https://packagephobia.com/badge?p=@se-oss/timeout)](https://packagephobia.com/result?p=@se-oss/timeout)

**A modern, feature-rich replacement for JavaScript's native `setTimeout` and `setInterval` that handles delays longer than 24.8 days and provides modern features like Promises and `AbortSignal` support.**

JavaScript's built-in `setTimeout` and `setInterval` have a maximum delay of `2^31 - 1` milliseconds (approximately 24.8 days). Attempting to use a longer delay causes the timer to fire almost immediately. This package provides drop-in replacements that handle arbitrarily long delays by automatically breaking them into smaller chunks, while also adding modern features for advanced control flow.

---

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [API](#-api)
- [Contributing](#-contributing)
- [License](#license)

## ✨ Features

| Feature                         | `@se-oss/timeout` | Native Timers (`setTimeout`, etc.) |
| ------------------------------- | :---------------: | :--------------------------------: |
| **Long Delays (> 24.8 days)**   |        ✅         |                 ❌                 |
| **Promise-based API (`delay`)** |        ✅         |                 ❌                 |
| **`AbortSignal` Cancellation**  |        ✅         |                 ❌                 |
| **Get Remaining Time**          |        ✅         |                 ❌                 |
| **Drop-in Replacement**         |        ✅         |                 ✅                 |
| **Works in Node.js & Browsers** |        ✅         |                 ✅                 |

## 📦 Installation

```bash
npm install @se-oss/timeout
```

<details>
<summary>Install using your favorite package manager</summary>

**pnpm**

```bash
pnpm install @se-oss/timeout
```

**yarn**

```bash
yarn add @se-oss/timeout
```

</details>

## 📖 Usage

### Handling Long Delays

Simply import `setTimeout` and `setInterval` from `@se-oss/timeout` and use them as you would with the native functions.

```typescript
import { setTimeout } from '@se-oss/timeout';

// Schedule a callback for 30 days in the future.
// With native setTimeout, this would fire immediately.
const timeout = setTimeout(
  () => {
    console.log('30 days have passed!');
  },
  30 * 24 * 60 * 60 * 1000
);

// You can still clear it as usual
// clearTimeout(timeout);
```

### Promise-based Delay with `AbortSignal`

For modern asynchronous code, the `delay` function provides a promise-based API that can be easily awaited and cancelled using an `AbortSignal`.

```typescript
import { AbortError, delay } from '@se-oss/timeout';

const controller = new AbortController();

async function someAsyncTask() {
  try {
    console.log('Waiting for 5 seconds...');
    await delay(5000, { signal: controller.signal });
    console.log('Done waiting.');
  } catch (error) {
    if (error instanceof AbortError) {
      console.log('The delay was aborted!');
    }
  }
}

const task = someAsyncTask();

// To cancel the delay from another part of your application:
// controller.abort();
```

### Checking Remaining Time

All timer objects returned by this package have a `remaining()` method that lets you check the time left until execution.

```typescript
import { setTimeout } from '@se-oss/timeout';

const timeout = setTimeout(() => {
  console.log('Fired!');
}, 5000);

setTimeout(() => {
  const timeLeft = timeout.remaining();
  console.log(
    `Approximately ${Math.round(timeLeft / 1000)} seconds remaining.`
  );
}, 2000);

// Logs: "Approximately 3 seconds remaining."
```

## 📚 API

For all configuration options, please see [the API docs](https://www.jsdocs.io/package/@se-oss/timeout).

### `setTimeout(callback, delay, ...args)`

Schedules a function to be called after a `delay`. Handles delays longer than 24.8 days.

- `callback: (...args) => void`: The function to call.
- `delay?: number`: The delay in milliseconds.
- `options?: { signal?: AbortSignal }`: An optional options object. If an `AbortSignal` is provided, the timeout is automatically cleared when the signal is aborted.
- `...args`: Optional arguments to pass to the callback.

Returns a `Timeout` object.

### `clearTimeout(timeout)`

Clears a timeout created with `setTimeout`.

- `timeout: Timeout`: The timeout object to clear.

### `setInterval(callback, delay, ...args)`

Schedules a function to be called repeatedly every `delay` milliseconds. Handles delays longer than 24.8 days.

- `callback: (...args) => void`: The function to call.
- `delay?: number`: The delay in milliseconds.
- `...args`: Optional arguments to pass to the callback.

Returns a `Timeout` object.

### `clearInterval(interval)`

Clears an interval created with `setInterval`.

- `interval: Timeout`: The interval object to clear.

### `delay(ms, options?)`

Returns a promise that resolves after a `ms` milliseconds.

- `ms: number`: The delay in milliseconds.
- `options?: { signal?: AbortSignal }`: An optional options object. If an `AbortSignal` is provided, the promise will reject with an `AbortError` when the signal is aborted.

### `Timeout` Object

The object returned by `setTimeout` and `setInterval`.

- `id: TimerHandle | undefined`: The internal timer ID.
- `cleared: boolean`: `true` if the timer has been cleared.
- `ref(): Timeout`: (Node.js only) Marks the timer as active, preventing the event loop from exiting.
- `unref(): Timeout`: (Node.js only) Allows the event loop to exit if this is the only active timer.
- `remaining(): number`: Returns the number of milliseconds remaining until the next execution.

### `AbortError`

An error class for rejections caused by an `AbortSignal`.

## 🤝 Contributing

Want to contribute? Awesome! To show your support is to star the project, or to raise issues on [GitHub](https://github.com/shahradelahi/ts-timeout)

Thanks again for your support, it is much appreciated! 🙏

## License

[MIT](/LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi) and [contributors](https://github.com/shahradelahi/ts-timeout/graphs/contributors).
