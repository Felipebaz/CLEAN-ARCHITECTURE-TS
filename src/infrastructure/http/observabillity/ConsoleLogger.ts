import type { Logger } from '@application/ports/Logger';

export class ConsoleLogger implements Logger {
    info(message: string, meta?: Record<string, unknown>): void {
        console.log(`[INFO] ${message}`, meta ?? {});
    }
    error(message: string, meta?: Record<string, unknown>): void {
        console.error(`[ERROR] ${message}`, meta ?? {});
    }
}
