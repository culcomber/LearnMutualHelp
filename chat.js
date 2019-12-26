
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var socket_event = require('./socket-event');

app.get('/', function(req, res){
    res.send('<h1>Welcome Realtime Server</h1>');
});

io.on('connection', socket_event);

http.listen(3001, function(){
    console.log('listening on *:3001');
});
