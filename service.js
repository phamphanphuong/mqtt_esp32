var mqtt = require('mqtt')

var options = {
    host: '06e8b6781884440da3ee8bcff720af3f.s1.eu.hivemq.cloud',
    port: 8883,
    protocol: 'mqtts',
    username: 'doremon',
    password: 'Doremon123',
}

// initialize the MQTT client
var client = mqtt.connect(options);

// setup the callbacks
client.on('connect', function () {
    console.log('Connected');
});

client.on('error', function (error) {
    console.log(error);
});

client.on('message', function (topic, message) {
    // called each time a message is received
    console.log('Received message:', topic, message.toString());
});

// subscribe to topic 'my/test/topic'
client.subscribe('my/test/topic');

// publish message 'Hello' to topic 'my/test/topic'
client.publish('my/test/topic', 'Hello');