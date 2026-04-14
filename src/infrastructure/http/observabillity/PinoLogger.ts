import pino from 'pino';
import type { Logger } from '@application/ports/Logger';

export class PinoLogger implements Logger {
    private readonly log = pino();

    info(message: string, meta?: Record<string, unknown>) {
        this.log.info(meta ?? {}, message);
    }

    error(message: string, meta?: Record<string, unknown>) {
        this.log.error(meta ?? {}, message);
    }

    // Implement other methods from the Logger interface
}