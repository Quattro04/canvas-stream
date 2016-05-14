var socket = io.connect();

/*function ChatController($scope) {

    $scope.messages = [];
    $scope.roster = [];
    $scope.name = '';
    $scope.text = '';

    socket.on('connect', function () {
      $scope.setName();
    });

    socket.on('message', function (msg) {
      $scope.messages.push(msg);
      $scope.$apply();
    });

    socket.on('roster', function (names) {
      $scope.roster = names;
      $scope.$apply();
    });

    $scope.send = function send() {
      //console.log('Sending message:', $scope.text);
      socket.emit('message', $scope.text);
      $scope.text = '';
    };

    $scope.setName = function setName() {
      socket.emit('identify', $scope.name);
    };
    
}*/

var socketID;

var canW;
var canH;

var canvas, liveFeed, ctx, holding, flag = false;

var boudRect;

var drawColor = "black";
var drawSize = 1;
var drawTool = "brush";

var audio;

function initNew() {
    socket.emit('new-user');
    socket.on('your-ID', function (data) {
        socketID = data.id;
    });
}

function createSession() {
    var e = document.getElementById("sizeSel");
    var res = e.options[e.selectedIndex].text;
    var resArr = res.split(" ");
    
    canW = resArr[0];
    canH = resArr[2];
}



function canvasInit() {
    
    canvas = document.getElementById('canv');
    
    canvas.width = canW;
    canvas.height = canH;
    
    ctx = canvas.getContext("2d");
    
    boudRect = canvas.getBoundingClientRect();

    canvas.addEventListener("mousemove", function (e) {
        findxy('move', e);
    }, false);
    canvas.addEventListener("mousedown", function (e) {
        findxy('down', e);
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        findxy('up', e);
    }, false);
    canvas.addEventListener("mouseout", function (e) {
        findxy('out', e);
    }, false);
    
    //canvas.disabled = true;
    document.getElementById("mute-button").disabled = true;
    
    liveFeed = document.getElementById("live-div");
}

function changeColor(obj) {
    switch (obj.id) {
        case "green":
            drawColor = "green";
            break;
        case "blue":
            drawColor = "blue";
            break;
        case "red":
            drawColor = "red";
            break;
        case "yellow":
            drawColor = "yellow";
            break;
        case "orange":
            drawColor = "orange";
            break;
        case "black":
            drawColor = "black";
            break;
        case "white":
            drawColor = "white";
            break;
    }
}

function draw(xC,yC,tool,color,size,clicked) {
    if (tool == "brush") {
        if (clicked) {
            ctx.beginPath();
            ctx.lineWidth = size;
            ctx.lineJoin = ctx.lineCap = 'round';
            ctx.moveTo(xC,yC);
        }
        else {
            ctx.lineTo(xC,yC);
            ctx.strokeStyle = color;
            ctx.stroke();
        }
        /*ctx.beginPath();
        ctx.arc(xC,yC,size,0,2*Math.PI);
        ctx.fillStyle = color;
        ctx.fill();*/
    }
    else if (tool == "spray") {
        ctx.fillStyle = color;
        for (var i = size; i--; ) {
            var offsetX = getRandomInt(-size, size);
            var offsetY = getRandomInt(-size, size);
            if (Math.abs(offsetX) + Math.abs(offsetY) < (size*2) - (size/2)) {
                ctx.fillRect(xC + offsetX, yC + offsetY, 1, 1);
            }
        }
    }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toolChanged() {
    var idx = $("input[name=tools]:checked").val();
    if (idx == 1) {
        drawTool = "brush";
    }
    else if (idx == 2) {
        drawTool = "spray";;
    }
}

function changeSize(idx) {
    drawSize = idx*idx*idx;
}

var x;
var y;
var img;

function findxy(res, e) {
    
    if (res == 'down') {
        
        // console.log(audio.currentTime);
        
        x = e.clientX + document.body.scrollLeft - boudRect.left;
        y = e.clientY + document.body.scrollTop - boudRect.top;
        holding = true;
        
        //img = canvas.toDataURL();
        
        // Draw with selected tool
            
        draw(x,y,drawTool,drawColor,drawSize,true);
        
        // Send data to server
        socket.emit('draw', {
            x: x,
            y: y,
            tool: drawTool,
            color: drawColor,
            size: drawSize,
            clicked: true
        });
        //socket.emit('canvas-shot', { img : img });
        
    }
    if (res == 'up' || res == "out") {
        holding = false;
    }
    if (res == 'move') {
        if (holding) {
            
            // Update coordinates
            
            x = e.clientX + document.body.scrollLeft - boudRect.left;
            y = e.clientY + document.body.scrollTop - boudRect.top;
            
            //img = canvas.toDataURL();
            //socket.emit('canvas-shot', { img : img });
            
            // Draw with selected tool
            
            draw(x,y,drawTool,drawColor,drawSize,false);
            
            // Send data to server

            socket.emit('draw', {
                x: x,
                y: y,
                tool: drawTool,
                color: drawColor,
                size: drawSize,
                clicked: false
            });
        }
    }
}

function playButtonPressed() {
    $("#audio-indicator").html('Loading...');
    document.getElementById("play-button").disabled = true;
    
    socket.emit('play-request');
}

var muted = false;
function muteButtonPressed() {
    if (muted) {
        audio.muted = false;
        muted = false;
        document.getElementById("mute-icon").setAttribute("class", "glyphicon glyphicon-volume-up");
    }
    else {
        audio.muted = true;
        muted = true;
        document.getElementById("mute-icon").setAttribute("class", "glyphicon glyphicon-volume-off");
    }
}

function moveProgress() {
  var elem = document.getElementById("progBar");   
  var idx = 0;
  var width = 0;
  var id = setInterval(frame, 250);
  
  function frame() {
    if (audio.currentTime == audio.duration) {
      clearInterval(id);
    } else {
      width = (audio.currentTime / audio.duration) * 100;
      elem.style.width = width + '%'; 
    }
    $("#audio-indicator").html(parseInt(audio.currentTime));
  }
}

var recorder;
    
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
    
    
    socket.on('draw-response', function (data) {
        draw(data.x,data.y,data.tool,data.color,data.size,data.clicked);
    });
    
    socket.on('play-response', function (file) {
        
        
        $("#audio-indicator").html('Loading...');
        document.getElementById("play-button").disabled = true;
        
        audio = new Audio(file.data);
        
        // When audio file is loaded
        audio.addEventListener('loadedmetadata', function() {
            socket.emit('play-ready');
        });
        
        audio.onended = function() {
            socket.emit('audio-ended');
            document.getElementById("play-button").disabled = false;
            document.getElementById("progBar").style.width = "0%";
            document.getElementById("mute-icon").setAttribute("class", "glyphicon glyphicon-volume-up");
            document.getElementById("mute-button").disabled = true;
            
            
            
            /*recorder.stop(function(blob) {
                var url = URL.createObjectURL(blob);
                window.open(url);
            });*/
        };
        
        
    })
    
    socket.on('play-ready-response', function (file) {
        canvas.style.pointerEvents = "auto";
        document.getElementById("mute-button").disabled = false;
        audio.play();
        moveProgress();
        
        //audio.currentTime = 50;
        
        /*recorder = new CanvasRecorder(canvas, {
            disableLogs: false
        });
        recorder.record();*/
        
    });
    
    socket.on('newUser-audio', function (data) {
        document.getElementById("play-button").disabled = true;
        
        audio = new Audio(data.song);
        
        audio.addEventListener('loadedmetadata', function() {
            socket.emit('newUser-audio-ready');
        });
    });
    
    socket.on('newUser-audio-ready-response', function (data) {
        canvas.style.pointerEvents = "auto";
        audio.play();
        audio.currentTime = data.time;
        moveProgress();
    });
    
    $('#records-panel').on("click", function (event) {
        if (event.target == this) return;
        clickedRecord = event.target.id;
        document.getElementById("rec-play-button").disabled = false;
    });
    
    socket.on('canvas-shot-response', function (data) {
        
        while (liveFeed.firstChild) {
            liveFeed.removeChild(liveFeed.firstChild);
        }
        
        var elem = document.createElement("img");
        elem.src = data.img;
        elem.height = 563;
        elem.width = 900;
        liveFeed.appendChild(elem);
    });
    
});

var recCtx;
function initRecords() {
    document.getElementById("rec-play-button").disabled = true;
    var recCanv = document.getElementById('recCanv');

    recCanv.width = canW;
    recCanv.height = canH;
    
    recCtx = recCanv.getContext("2d");
    
    socket.emit('get-record-names');
    var i = 0;
    socket.on('record-names-response', function (data) {
        data.names.forEach(function(name) {
            $('#records-panel').append($('<div id=\"' + i + '\"></div>').html(name));
            i++;
        });
    })
}

var clickedRecord;
function playRecordPressed() {
     socket.emit('get-record', { id : clickedRecord });
     socket.on('record-response', function (data) {
         
        //var d2 = new Date();
        //var t = d2.getTime();

        //console.log(data.record);

        drawRecord(data.record);
    })
}

// Function that calls drawR every 1 millisecond, which calls recDraw if there is something to draw
function drawRecord(actions) {
    var i = 0;
    var j = 0;
    var id = setInterval(drawR, 1);
    function drawR() {
        //console.log(actions[j].time + " " + i);
        if (actions[j].time - 50000 == i) {
            recDraw(actions[j].x, actions[j].y, actions[j].tool, actions[j].color, actions[j].size);
            j++;
        }
        else {
            i++;
        }
        if (i == actions[actions.length - 1].time) {
            clearInterval(id);
        }
    }
}

/*function recDraw(xC,yC,tool,color,size) {
    if (tool == "brush") {
        recCtx.beginPath();
        recCtx.arc(xC,yC,size,0,2*Math.PI);
        recCtx.fillStyle = color;
        recCtx.fill();
    }
    else if (tool == "spray") {
        recCtx.fillStyle = color;
        for (var i = size; i--; ) {
            var offsetX = getRandomInt(-size, size);
            var offsetY = getRandomInt(-size, size);
            if (Math.abs(offsetX) + Math.abs(offsetY) < (size*2) - (size/2)) {
                recCtx.fillRect(xC + offsetX, yC + offsetY, 1, 1);
            }
        }
    }
}*/



