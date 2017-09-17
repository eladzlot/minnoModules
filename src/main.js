// create
$source [arg]

// transform
$logs {log}

// aggregate (we organize by pulses or by tasks)
$logs 
    ...logs
    ...logs
    ..logs

// compose (add metaData etc.

// serialize
JSON.stringify

// send
post?


$pulse = $logs
    .map(pulse(3))
 
stream
    .merge([$pulse, $pulse.end], value => value.length < pulse ? stream.HALT : value)
    .map(serialize)
    .map(send)

    The problem is that 
