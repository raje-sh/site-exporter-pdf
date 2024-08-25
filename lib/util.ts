import { debug } from "./logger";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

export async function withTiming<T>(fn: AsyncFunction<T>): Promise<T> {
    const start = process.hrtime();
    const result = await fn();
    const [seconds, nanoseconds] = process.hrtime(start);
    const elapsed = seconds * 1000 + nanoseconds / 1e6;
    debug(`Time Taken: %s ms.`, fn.name, elapsed.toFixed(2));
    return result;
}
