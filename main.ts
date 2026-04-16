import { buildContainer } from '@composition/container';
import { buildServer } from '@infrastructure/http/server';

async function main() {
    const container = buildContainer();
    const server    = await buildServer(container);

    const port = Number(process.env['PORT'] ?? 3000);
    await server.listen({ port, host: '0.0.0.0' });
    container.ports.logger.info(`Server listening on port ${port}`);

    const shutdown = async (signal: string) => {
        container.ports.logger.info(`${signal} received — shutting down`);
        await server.close();
        process.exit(0);
    };

    process.on('SIGINT',  () => { void shutdown('SIGINT'); });
    process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
}

main().catch(err => { console.error(err); process.exit(1); });
