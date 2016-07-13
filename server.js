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

var dl = require('delivery');
var FileReader = require('filereader');
var File = require("File");

var router = express();
var server = http.createServer(router);

var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));

var sockets = [];
//var usernames = {};
//var usersInNew = 0;
//var userNum = 0;

var genNum = 0;
var sessions = {};
var sessionsReady = [];

var records = {};

var socketsReady = 0;

// Read as DataURL
var gsDataURL;
var reader = new FileReader();
reader.onload = function(e) {
    gsDataURL = reader.result;
}
reader.readAsDataURL(new File('public/audio/greensleeves.mp3'));

//var rand = require('random-seed').create();
var randAngle = [];
var randNums = [];
//rand.initState();
var i;
for (i = 0; i < 10000; i++) {
    randAngle.push(Math.random() * Math.PI*2);
    randNums.push(Math.random() * 1000);
}

io.set('log level', 1);

io.on('connection', function(socket) {

    sockets.push(socket);
    //console.log(socket.id);
    socket.on('disconnect', function() {
        sockets.splice(sockets.indexOf(socket), 1);
        //updateUsers(socket);
    });
  
    // NEW SESSION
  
    socket.on('new-session', function(data) {
        genNum++;
        var session = {
            users: [],
            sessionData: {name: data.name, canW: 0, canH: 0},
            show: true,
            actions: []
        };
        var user = {name: "Creator", id: socket.id, conductor: true};
        sessions[genNum] = session;
        sessions[genNum].users.push(user);
        
        var sessionReady = { users: [] };
        sessionsReady[genNum] = sessionReady;
        
        var record = {
            name: sessions[genNum].sessionData.name,
            audio: gsDataURL,
            canW: 0,
            canH: 0,
            actions: []
        }
        records[genNum] = record;
        
        socket.emit('user-data', { user: user, sessionID: genNum });
        updateUsers(genNum);
    });
    
    // JOIN SESSION
    
    socket.on('join-refresh-req', function() {
        socket.emit('join-refresh-res', { sessions: sessions });
    });
    socket.on('join-room-req', function(data) {
        
        if (!sessions[data.room].show) {
            socket.emit('join-refresh-res', { sessions: sessions });
            return;
        }
        
        var userNum = sessions[data.room].users.length + 1;
        var username = "User " + userNum;
        var user = {name: username, id: socket.id, conductor: false};
        sessions[data.room].users.push(user);
        
        socket.emit('user-data', { user: user, sessionID: data.room });
        var msg = "<font color=\"blue\"><i>" + user.name + " joined the room</i></font>";
        sendMessage(msg,data.room);
        updateUsers(data.room);
    });
    
    // LEAVE NEW PAGE
    
    socket.on('leaving-new', function(data) {
        if (sessions.length == 0) return;
        
        var msg = "<font color=\"blue\"><i>" +  sessions[data.sessionID].users[data.user].name + " left the room</i></font>";
        sendMessage(msg,data.sessionID);
        sessions[data.sessionID].users.splice(data.user, 1);
        
        if (sessions[data.sessionID].users.length == 0) {
            delete sessions[data.sessionID];
            delete sessionsReady[data.sessionID];
        }
        else {
            updateUsers(data.sessionID);
        }
    });
    
    socket.on('leaving-canvas', function(data) {
        delete sessions[data.sessionID];
    });
    
    // SEND MESSAGE, CHANGE USERNAME ON NEW
    
    socket.on('send-message', function(data) {
        var msg = "<b>" + sessions[data.session].users[data.user].name + "</b>: " + data.message;
        sendMessage(msg,data.session);
    });
    
    socket.on('change-username', function(data) {
        var oldName = sessions[data.session].users[data.user].name;
        sessions[data.session].users[data.user].name = data.name;
        
        var msg = "<font color=\"blue\"><i>" +  oldName + " renamed to " + data.name + "</i></font>";
        sendMessage(msg,data.session);
        updateUsers(data.session);
    });
    
    // START SESSION
    
    socket.on('start-session', function(data) {
        sessions[data.session].sessionData.canW = data.width;
        sessions[data.session].sessionData.canH = data.height;
        sessions[data.session].show = false;
        
        records[data.session].canW = data.width;
        records[data.session].canH = data.height;
        
        startSession(data.session);
    });
    
    // DRAW
    
    socket.on('draw', function(data) {
        var usersInSession = sessions[data.session].users;
        for (var i = 0; i < usersInSession.length; i++) {
            var id = usersInSession[i].id;
            io.sockets.sockets[id].emit('draw-response', data);
        }
        records[data.session].actions.push(data);
    });
    
    // AUDIO
    
    socket.on('play-ready', function(data) {
        
        sessionsReady[data.session].users.push(socket.id);
        
        if (sessionsReady[data.session].users.length == sessions[data.session].users.length) {
            for (var i = 0; i < sessions[data.session].users.length; i++) {
                var id = sessions[data.session].users[i].id;
                io.sockets.sockets[id].emit('play-ready-response');
            }
        }
    });
    
    socket.on('audio-ended', function(data) {

    });
    
    // RECORDS
    
    socket.on('records-req', function() {
        socket.emit('records-res', { records: records });
    });
    
    socket.on('get-record', function(data) {
        socket.emit('get-record-res', { record: records[data.id], randNums:randNums, randAngle:randAngle });
    });
    
    /*socket.on('canvas-shot', function(data) {
        socket.broadcast.emit('canvas-shot-response', data);
    });
    
    socket.on('play-request', function(data) {
        socket.emit('play-response', {
            data: gsDataURL
        });
    });*/
    
    
    
    
    
    
});

function updateUsers(sessionID) {
    var usersInSession = sessions[sessionID].users;
    for (var i = 0; i < usersInSession.length; i++) {
        var id = usersInSession[i].id;
        io.sockets.sockets[id].emit('update-users', { users: usersInSession });
    }
}

function sendMessage(message,sessionID) {
    var usersInSession = sessions[sessionID].users;
    for (var i = 0; i < usersInSession.length; i++) {
        var id = usersInSession[i].id;
        io.sockets.sockets[id].emit('send-message-res', { message: message });
    }
}

function startSession(sessionID) {
    var usersInSession = sessions[sessionID].users;
    for (var i = 0; i < usersInSession.length; i++) {
        var id = usersInSession[i].id;
        io.sockets.sockets[id].emit('canvas-init', { 
            session: sessions[sessionID],
            randNums: randNums,
            randAngle: randAngle,
            audio: gsDataURL
        });
    }
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});