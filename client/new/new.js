var socket = io.connect();

var socketID;
var mySessionNum;
var myUserNum;

function init() {
    socket.emit('join-refresh-req');
    //socket.emit('new-session');
    document.getElementById("users-panel-body").innerHTML = "<p style=\"margin-left:15px;margin-top:15px;\">Join or create a room</p>";
    document.getElementById("chat-panel-body").innerHTML = "<p>Join or create a room</p>";
    document.getElementById("username-input").disabled = true;
    document.getElementById("message-input").disabled = true;
}

function join(val) {
    socket.emit('join-room-req', { room: val });
}

function refreshRooms() {
    socket.emit('join-refresh-req');
}

function createSession() {
    var name = document.getElementById("nameInput").value;
    
    if (name == "") {
        document.getElementById("nameInput").style.backgroundColor = "#cf0000";
        var id = setInterval(clear, 200);
        var n = 1;
        function clear() {
            if (n == 2) {
                document.getElementById("nameInput").style.backgroundColor = "#ffffff";
                clearInterval(id);
            }
            else {
                n++;
            }
        }
        return;
    }
    
    var e = document.getElementById("sizeSel");
    var res = e.options[e.selectedIndex].text;
    var resArr = res.split(" ");
    
    var name = document.getElementById("nameInput").value;
    
    
    var d = document.getElementById("newS");
    d.className += "disabled";
    //document.getElementById("newS").disabled = true;
    
    socket.emit('start-session', {name : name, width :  resArr[0], height :  resArr[2]});
}



$(document).ready(function() {
    $('#new-room-form').submit(function() {
        var name = document.getElementById("new-room-input").value;
        document.getElementById("new-room-input").value = "";
        socket.emit('new-session', { name : name });
        return false;
    });
    
    $('#username-input-form').submit(function() {
        var name = document.getElementById("username-input").value;
        document.getElementById("username-input").value = "";
        socket.emit('change-username', { name : name, session: mySessionNum, user: myUserNum });
        return false;
    });
    
    $('#message-input-form').submit(function() {
        var message = document.getElementById("message-input").value;
        document.getElementById("message-input").value = "";
        socket.emit('send-message', { message : message, session: mySessionNum, user: myUserNum });
        return false;
    });
    
    socket.on('join-refresh-res', function(data) {
        
        if (data.sessions.length == 0) document.getElementById("join-panel-body").innerHTML = "<p style=\"margin-left:15px;margin-top:15px;\">No rooms available</p>";
        else document.getElementById("join-panel-body").innerHTML = "<ul id=\"join-list\" class=\"list-group\"></ul>";
        
        /*var list = document.getElementById("join-list");
        while (list.hasChildNodes()) {   
            list.removeChild(list.firstChild);
        }*/
        var check;
        // Go through sessions
        for (var i = 0; i < data.sessions.length; i++) {
            check = true;
            // Go through users in that session and see if this user is in that session
            for (var j = 0; j < data.sessions[i].users.length; j++) {
                if (data.sessions[i].users[j].id == socketID) {
                    
                    mySessionNum = i;
                    myUserNum = j;
                    
                    var name = data.sessions[i].sessionData.name;
                    var li = document.createElement("LI");
                    
                    li.innerHTML = "<b>" + name + "</b> <span style=\"float:right;\"><small>Users in the room: " + data.sessions[i].users.length + "</small>" +
                    "<span style=\"margin-left:48px;\">Joined</span></span>";
                    
                    li.classList.add("list-group-item");
                    document.getElementById("join-list").appendChild(li);
                    check = false;
                    break;
                }
            }
            if (check) {
                var name = data.sessions[i].sessionData.name;
                var li = document.createElement("LI");
                
                li.innerHTML = "<b>" + name + "</b> <span style=\"float:right;\"><small>Users in the room: " + data.sessions[i].users.length + "</small>" +
                "<button id=\"join-button\" type=\"button\" class=\"btn btn-primary\" style=\"margin-left:50px;\" onclick=\"join(" + i + 
                ")\"><span class=\"glyphicon glyphicon-chevron-right\"></span></button></span>";
                
                li.classList.add("list-group-item");
                document.getElementById("join-list").appendChild(li);
            }
        }
    });
    
    socket.on('user-data', function (data) {
        socketID = data.user.id;
        document.getElementById("username-input").disabled = false;
        document.getElementById("message-input").disabled = false;
        document.getElementById("chat-panel-body").innerHTML = "";
        
        if (data.user.conductor) document.getElementById("start-session-div").style.visibility = "visible";
        
        socket.emit('join-refresh-req');
    });
    
    socket.on('update-users', function (data) {
        document.getElementById("users-panel-body").innerHTML = "<ul id=\"users-list\" class=\"list-group\"></ul>";
        for (var i = 0; i < data.users.length; i++) {
            
            var li = document.createElement("LI");
            if (data.users[i].id == socketID) {
                if (data.users[i].conductor) li.innerHTML = "<font color=\"blue\"><b>" + data.users[i].name + "<small> (Conductor)</small></b></font>";
                else li.innerHTML = "<font color=\"blue\"><b>" + data.users[i].name + "</b></font>";
            }
            else if (data.users[i].conductor) {
                li.innerHTML = "<b>" + data.users[i].name + "<small> (Conductor)</small></b>";
            }
            else {
                li.innerHTML = data.users[i].name;
            }
            li.classList.add("list-group-item");
            document.getElementById("users-list").appendChild(li);
        }
    });
    
    socket.on('send-message-res', function (data) {
        var chat = document.getElementById("chat-panel-body");
        chat.innerHTML = chat.innerHTML + "<p>" + data.message + "</p>";
        $('#chat-panel-body').scrollTop($('#chat-panel-body').prop('scrollHeight'));
    });
    
    socket.on('start-session-response', function () {
        var url = window.location.href;
        url = url.slice(0,-4);
        url = url + "canvas";
        window.location.href = url;
    });
});

$( window ).unload(function() {
    socket.emit('leaving-new', { session: mySessionNum, user: myUserNum });
});