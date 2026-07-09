type Job = () => Promise<void>;

/**
 * Minimal in-process background job queue.
 *
 * Brief/summary generation is triggered from an API route, which flips the
 * relevant row to GENERATING and enqueues the actual AI call here instead of
 * awaiting it inline. The route returns immediately and the client polls a
 * status endpoint, so the UI behaves the same way it would against a real
 * job queue.
 *
 * This is intentionally dependency-free for the MVP (no Redis needed to run
 * locally). It processes jobs one at a time within this Node process, which
 * is sufficient for a single-instance deployment. For production scale with
 * multiple instances, swap this module for BullMQ + Redis (or a hosted
 * queue) behind the same `enqueue` interface - call sites don't need to
 * change.
 */
class InMemoryQueue {
  private queue: Job[] = [];
  private processing = false;

  enqueue(job: Job) {
    this.queue.push(job);
    void this.process();
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;
      try {
        await job();
      } catch (error) {
        console.error("[jobs] job failed", error);
      }
    }
    this.processing = false;
  }
}

const globalForQueue = globalThis as unknown as { jobQueue?: InMemoryQueue };

export const jobQueue = globalForQueue.jobQueue ?? new InMemoryQueue();

if (process.env.NODE_ENV !== "production") {
  globalForQueue.jobQueue = jobQueue;
}
