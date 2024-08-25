import createDebugger from 'debug';

const debug = createDebugger('site-exporter:common');
[debug].forEach(it => {
    it.log = console.log.bind(console);
})
const error = createDebugger('site-exporter:errors');
export {
    debug,
    error
}