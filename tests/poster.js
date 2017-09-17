const o = require('ospec');
const stream = require('mithril-stream');
const _;

function defaultSend(logArr, settings = {}){ 
    const {url, post, metaData, error} = settings;
    const serialized = serialize(logArr);
    return post(url,serialized)
        .catch(function retry(){ return post(url, serialized); })
        .catch(error || _.noop);

    function serialize(){
        const data = _.assign({json: JSON.stringify(logs)}, metaData);
        const r = [];
        let key;

        for (key in data) r.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        return r.join('&').replace(/%20/g, '+');
    }
}

/**
 * poster
 *
 * a set of side effects commonly used to post from minno
 *
 * @arg {Stream[Any]} $logs - a stream of logs
 * @arg {Object} settings
 * @arg {Function}  settings.send - a function that sends an array of logs (Array logArr, Object settings) => void
 * @arg {Number}    settings.pulse - the max number of logs to include in each post
 */
function poster($logs, settings = {}){
    const {send = defaultSend, pulse} = settings;
    const logArr = [];

    $logs.map(forEachLog);
    $logs.end.map(finalizefLogs);

    return new Promise(function(resolve){
        $logs.end.map(resolve);
    });

    function forEachLog(log){
        logArr.push(log);
        if (!pulse) return;
        if (logArr.length < pulse) return;
        send(logArr, settings);
        logArr.length = 0;
    }

    function finalizefLogs(){
        send(logArr, settings);
    }
}

o.spec('poster', () => {
    o('returns promise', done => {
        const spy = o.spy();
        const $logs = stream();
        const promise = poster($logs);

        promise.then(spy);

        o(typeof promise.then).equals('function') `returns a promise`;

        o(spy.callCount).equals(0) `promise is not auto resolved`;
        $logs.end(true);

        promise
            .then(() => o(spy.callCount).equals(1) `promise resolved when $logs ends`)
            .then(done);
    });

    o.only('on end send logArr', () => {
        const $logs = stream();
        const send = o.spy(val => logArr = [].concat(val)); // the logArr is immidiately deleted in code so we need to copy it
        let logArr;
        poster($logs, {send});
        $logs(1);
        $logs(2);
        $logs(3);
        o(send.callCount).equals(0) `send is not called prematurely`;
        $logs.end(true);
        o(send.callCount).equals(1) `send is called only once`;
        o(logArr).deepEquals([1,2,3]) `send is called with the correct logArr`;
    });

    o('on pulse send logArr', () => {
        const $logs = stream();
        const send = o.spy(val => logArr = [].concat(val)); // the logArr is immidiately deleted in code so we need to copy it
        let logArr;
        poster($logs, {send, pulse:2});
        $logs(1);
        $logs(2);
        $logs(3);
        $logs(4);
        o(send.callCount).equals(2) `send is called for each pulse`;
        o(logArr).deepEquals([3,4]) `send is called with the appropriate logs`;
    });
});
