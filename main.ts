import { loadConfig } from '@composition/config';
import { buildContainer } from '@composition/container';
import { buildServer } from '@infrastructure/http/server';

async function main() {
    const config    = loadConfig();
    const container = buildContainer(config);
    const server    = await buildServer(container);

    await server.listen({ port: config.PORT, host: '0.0.0.0' });
    container.ports.logger.info(`Server listening on port ${config.PORT}`, {
        env:       config.NODE_ENV,
        inMemory:  config.USE_IN_MEMORY,
    });

    let shuttingDown = false;

    const shutdown = async (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;

        container.ports.logger.info(`${signal} received — shutting down`);

        try {
            await server.close();          // deja de aceptar conexiones nuevas
            await container.shutdown();    // detiene dispatcher + cierra pool
            container.ports.logger.info('Shutdown complete');
            process.exit(0);
        } catch (err) {
            container.ports.logger.error('Error during shutdown', { cause: String(err) });
            process.exit(1);
        }
    };

    process.on('SIGINT',  () => { void shutdown('SIGINT'); });
    process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
}

main().catch(err => { console.error(err); process.exit(1); });
