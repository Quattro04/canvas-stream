var socket = io.connect();

var socketID;

function initNew() {
    socket.emit('new-user');
    socket.on('your-ID', function (data) {
        socketID = data.id;
    });
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
    $('#username-input-form').submit(function() {
        var name = document.getElementById("username-input").value;
        document.getElementById("username-input").value = "";
        socket.emit('change-username', { name : name });
        return false;
    });
    
    $('#message-input-form').submit(function() {
        var message = document.getElementById("message-input").value;
        document.getElementById("message-input").value = "";
        socket.emit('send-message', { message : message });
        return false;
    });
    
    socket.on('update-users-response', function (data) {
        
        var list = document.getElementById("users-list");
        while (list.hasChildNodes()) {   
            list.removeChild(list.firstChild);
        }
        
        var keys = Object.keys(data.users);
        
        //$('#users-list').empty();
        var i;
        for (i = 0; i < keys.length; i++) {
            
            var li = document.createElement("LI");
            if (keys[i] == socketID) {
                li.innerHTML = "<b>"+data.users[keys[i]]+" (You)</b>";
            }
            else {
                li.innerHTML = data.users[keys[i]];
            }
            li.classList.add("list-group-item");
            document.getElementById("users-list").appendChild(li);
            
            
            //$('#users-list').append(data.users[keys[i]]);
        }
    });
    
    socket.on('send-message-response', function (data) {
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