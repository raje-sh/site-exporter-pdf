import createDebugger from 'debug';

const createLogger = (name: string) => {
    const logger = createDebugger(`site-exporter:${name}`);
    logger.log = console.log.bind(console);
    return logger;
}
const error = createDebugger('site-exporter:errors');
const debug = createLogger('common');
export {
    debug,
    error,
    createLogger
}