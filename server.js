//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');


//var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');

var dl  = require('delivery');
var FileReader = require('filereader');
var File = require("File");
//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);

var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];

var actions = [];

var socketsReady = 0;

// Read as DataURL
var gsDataURL;
var reader = new FileReader();
reader.onload = function(e) {
  gsDataURL = reader.result;
  
}
reader.readAsDataURL(new File('public/audio/greensleeves.mp3'));


io.set('log level', 1);

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });
    actions.forEach(function (data) {
      socket.emit('draw-response', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
    
    socket.on('draw', function (data) {
      socket.broadcast.emit('draw-response',data);
      actions.push(data);
    });
    
    socket.on('play-request', function (data) {
      io.sockets.emit('play-response', { data : gsDataURL });
    });
    
    socket.on('play-ready', function (data) {
      socketsReady += 1;
      if (socketsReady == sockets.length) {
        socketsReady = 0;
        io.sockets.emit('play-ready-response', { name : 'Greensleeves' });
      }
    });
});

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Server listening at", addr.address + ":" + addr.port);
});