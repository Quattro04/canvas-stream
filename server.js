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

var usernames = {};

var messages = [];
var sockets = [];

var recordNames = [];
var records = [];

var actions = [];

var socketsReady = 0;

// Read as DataURL
var gsDataURL;
var reader = new FileReader();
reader.onload = function(e) {
  gsDataURL = reader.result;
  
}
reader.readAsDataURL(new File('public/audio/greensleeves.mp3'));

// Start time
var startTime;

// If audio is playing
var playing = false;

io.set('log level', 1);

io.on('connection', function (socket) {
    /*messages.forEach(function (data) {
      socket.emit('message', data);
    });
    actions.forEach(function (data) {
      socket.emit('draw-response', data);
    });
    if (playing) {
      socket.emit('newUser-audio', { song : gsDataURL });
    }*/
    
    sockets.push(socket);

    socket.on('disconnect', function () {
      /*sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();*/
      delete usernames[socket.id];
      updateUsers(socket);
    });
    
    socket.on('new-user', function () {
      usernames[socket.id] = "Anonymous";
      socket.emit('your-ID', {id : socket.id});
      updateUsers(socket);
    });
    
    socket.on('change-username', function (data) {
      usernames[socket.id] = data.name;
      updateUsers(socket);
    });
    
    socket.on('send-message', function (data) {
      var msg = "<b>" + usernames[socket.id] + "</b>: " + data.message;
      io.sockets.emit('send-message-response', {message : msg});
    });

    /*socket.on('message', function (msg) {
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
    });*/
    
    socket.on('draw', function (data) {
      //var d = new Date();
      //var t = d.getTime();
      
      //console.log((t-startTime-100) / 1000);
      
      socket.broadcast.emit('draw-response', data);
      //io.sockets.emit('time',{ t : (t-startTime-100) / 1000 });
      actions.push(data);
    });
    
    socket.on('canvas-shot', function (data) {
      socket.broadcast.emit('canvas-shot-response', data);
    });
    
    
    socket.on('play-request', function (data) {
      io.sockets.emit('play-response', { data : gsDataURL });
    });
    
    socket.on('play-ready', function (data) {
      socketsReady += 1;
      if (socketsReady == sockets.length) {
        socketsReady = 0;
        io.sockets.emit('play-ready-response', { name : 'Greensleeves' });
        
        var d = new Date();
        startTime = d.getTime();
        
        playing = true;
      }
      
      
      
    });
    
    socket.on('newUser-audio-ready', function (data) {
      var d = new Date();
      var t = d.getTime();
      socket.emit('newUser-audio-ready-response', { time : (t-startTime) / 1000 });
    });
    
    socket.on('audio-ended', function (data) {
      recordNames.push("Record 1");
      records.push(actions);
      actions = [];
      playing = false;
      startTime = 0;
    });
    
    socket.on('get-record-names', function (data) {
      socket.emit('record-names-response', { names : recordNames });
    });
    
    socket.on('get-record', function (data) {
      socket.emit('record-response', { record : records[data.id] });
    });
    
});

function updateUsers(socket) {
  io.sockets.emit('update-users-response', { users : usernames, myID : socket.id });
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