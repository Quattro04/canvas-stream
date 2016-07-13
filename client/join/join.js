var socket = io.connect();

function init() {
    socket.emit('join-refresh-req');
}

function join(val) {
    console.log(val);
    socket.emit('join-room-req', { room: val });
}

$(document).ready(function() {
    socket.on('join-refresh-res', function(data) {
        var list = document.getElementById("join-list");
        while (list.hasChildNodes()) {   
            list.removeChild(list.firstChild);
        }
        //console.log(data.sessions);
        for (var i = 0; i < data.sessions.length; i++) {
            
            var li = document.createElement("LI");
            li.innerHTML = "<b>Session " + (i+1) + "</b> <small style=\"margin-left:25%;\">Users in the room: " + data.sessions[i].users.length + "</small>" + 
            "<button id=\"join-button\" type=\"button\" class=\"btn btn-primary\" onclick=\"join(" + i + ")\"><span class=\"glyphicon glyphicon-chevron-right\"></span></button>";
            li.classList.add("list-group-item");
            document.getElementById("join-list").appendChild(li);
        }
    });
});