import { Pool } from 'pg';
import { buildServer } from '@infrastructure/http/server';
import { buildContainer } from '@composition/container';

async function main() {
    const container = buildContainer();
    const server = buildServer(container);
    
    const port = Number(container.cfg.PORT);
    const address = await server.listen({ port });
    container.ports?.events && container.cfg.USE_IN_MEMORY_DB === 'false' && console.log("Outbox ready");

    const shutdown = async( signal: string) => {
        container.logger.info(`Received ${signal}, shutting down...`);
        await server.close();
        if (container.pool) await container.pool.end();
        process.exit(0);
    }

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch(err => {console.error(err); process.exit(1)});
