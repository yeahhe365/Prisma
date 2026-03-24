/**
 * Retry Utility for API calls
 * Implements exponential backoff with jitter and handles transient errors (429, 5xx).
 */

const getRetryAfterMs = (error: any): number | null => {
  // Check Retry-After header from OpenAI SDK errors
  const retryAfter = error?.headers?.get?.('retry-after') || error?.response?.headers?.get?.('retry-after');
  if (retryAfter) {
    const seconds = parseFloat(retryAfter);
    if (!isNaN(seconds)) return seconds * 1000;
    // Handle date format
    const date = new Date(retryAfter);
    if (!isNaN(date.getTime())) return Math.max(0, date.getTime() - Date.now());
  }
  return null;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      const status = error?.status || error?.response?.status;
      const message = error?.message || "";
      
      const isRateLimit = status === 429;
      const isServerError = status >= 500 && status < 600;
      const isNetworkError = !status;
      const isTransient = isRateLimit || isServerError || isNetworkError;

      if (attempt === maxRetries || !isTransient) {
        console.error(`[Prisma] Final attempt ${attempt} failed:`, error);
        throw error;
      }

      // Respect Retry-After header if present
      const retryAfterMs = getRetryAfterMs(error);
      
      // Exponential backoff with jitter: base * 2^(attempt-1) + random jitter
      const jitter = Math.random() * 1000;
      const delay = retryAfterMs || (initialDelay * Math.pow(2, attempt - 1) + jitter);
      
      console.warn(
        `[Prisma] API call failed (Attempt ${attempt}/${maxRetries}). ` +
        `Status: ${status || 'Network Error'}. Retrying in ${Math.round(delay)}ms...`
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Maximum retries reached without success");
}

/**
 * Simple request queue to serialize concurrent API calls and avoid 429s.
 */
export class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;
  private concurrency: number;
  private activeCount = 0;

  constructor(concurrency: number = 2) {
    this.concurrency = concurrency;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0 && this.activeCount < this.concurrency) {
      const task = this.queue.shift()!;
      this.activeCount++;
      task().finally(() => {
        this.activeCount--;
        this.process();
      });
    }

    this.running = false;
  }
}
