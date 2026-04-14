/**
 * Simple token-bucket rate limiter.
 * Ensures at most `maxPerWindow` calls per `windowMs`.
 */
export function createRateLimiter(maxPerWindow, windowMs) {
  const timestamps = [];

  return async function throttle() {
    const now = Date.now();
    // Remove timestamps outside the window
    while (timestamps.length && timestamps[0] < now - windowMs) {
      timestamps.shift();
    }
    if (timestamps.length >= maxPerWindow) {
      const waitUntil = timestamps[0] + windowMs;
      const delay = waitUntil - now;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    timestamps.push(Date.now());
  };
}
