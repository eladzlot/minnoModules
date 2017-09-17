const o = require('ospec');
const stream = require('mithril-stream');

/**
 * Logger
 * 
 * Maps source arguments into a log object, and applies any needed side effects
 *
 * @arg {Stream[Array]} $source - an array of arguments for creating $logs
 * @arg {Object} settings
 * @arg {Function} settings.transform - a map from $source to $logs (default: a=>a)
 * @arg {Function} settings.sideeffects - apply side effect to $logs ($logs, settings) => void
 *
 * @returns {Stream[Any]} - a stream of transformed logs
 **/
function Logger($source, settings = {} ){
    const {transform = unit, sideeffects} = settings;
    const $logs = $source
        .map(validateArgs)
        .map(applyMap(transform));

    if (sideeffects) sideeffects($logs, settings);

    return $logs;
}

function unit(a){ return a; }
function applyMap(fn){ return args => fn.apply(null, args); }
function validateArgs(args){
    if (Array.isArray(args)) return args;
    throw new Error('Logger $source must be a Stream of argument arrays');
}

o('returns a new stream', () => {
    const $source = stream();
    const $logs = Logger($source);

    o(!!$logs._state).equals(true) `is a stream`;
    o($logs).notEquals($source) `is a new stream`;
});

o('maps arguments from $source to $logs', () => {
    const $source = stream();
    const sum = (...args) => args.reduce((a,b) => a + b, 0);
    const transform = o.spy(sum);
    const logValue = o.spy();
    const $logs = Logger($source, {transform});

    $logs.map(logValue);

    $source([0,0,0]);
    o(transform.args).deepEquals([0,0,0]) `args are inputed`;
    o(logValue.args[0]).equals(0) `log is outputed`;

    $source([1,2,3]);
    o(transform.args).deepEquals([1,2,3]) `args are inputed`;
    o(logValue.args[0]).equals(6) `log is outputed`;

    o(logValue.callCount).equals(2);
});

o('throws if $source streams non array', () => {
    const $source = stream();
    Logger($source);
    try {
        $source(null);
        o('streamed null').equals(true);
    } catch(e){
        // this is good, just continue
    }
});

o('applies side effects', () => {
    const spy = o.spy();
    const $source = stream();
    const settings = {sideeffects:spy};
    const $logs = Logger($source, settings);
    o(spy.args).deepEquals([$logs, settings]);
});
