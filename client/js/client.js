var socket = io.connect();

function ChatController($scope) {
    

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
    
}




var canW = "900";
var canH = "563";

var canvas, ctx, holding, flag = false;

var boudRect;

var drawColor = "black";
var drawSize = 2;
var drawTool = "pencil";

var audio;

function init() {
    
    /*var img = document.getElementById('image');
    var cs = getComputedStyle(img);
    var width = parseInt(cs.getPropertyValue('width'), 10);
    var height = parseInt(cs.getPropertyValue('height'), 10);*/
    
    canvas = document.getElementById('canv');
    
    canvas.width = canW;
    canvas.height = canH;
    
    ctx = canvas.getContext("2d");
    
    boudRect = canvas.getBoundingClientRect();

    canvas.addEventListener("mousemove", function (e) {
        findxy('move', e)
    }, false);
    canvas.addEventListener("mousedown", function (e) {
        findxy('down', e)
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        findxy('up', e)
    }, false);
    canvas.addEventListener("mouseout", function (e) {
        findxy('out', e)
    }, false);
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

function draw(xC,yC,tool,color,size) {
    if (tool == "pencil") {
        ctx.beginPath();
        ctx.arc(xC,yC,size,0,2*Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
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



/*function drawPencil(x,y,col,size) {
    /*ctx.beginPath();
    ctx.moveTo(pX,pY);
    ctx.lineTo(cX,cY);
    ctx.strokeStyle = col;
    ctx.lineWidth = size;
    ctx.stroke();
    ctx.closePath();
    var radius = size*2;
    
}

function drawSpray(x,y,col,size) {
    var radius = size*2;
    ctx.fillStyle = col;
    for (var i = radius; i--; ) {
        var offsetX = getRandomInt(-radius, radius);
        var offsetY = getRandomInt(-radius, radius);
        if (Math.abs(offsetX) + Math.abs(offsetY) < (radius*2) - (radius/2)) {
            ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
        }
    }
}*/

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toolChanged() {
    var idx = $("input[name=tools]:checked").val();
    if (idx == 1) {
        drawTool = "pencil";
    }
    else if (idx == 2) {
        drawTool = "spray";;
    }
}

function changeSize(idx) {
    drawSize = idx*10-5;
}

var x;
var y;

function findxy(res, e) {
    
    if (res == 'down') {
        
        x = e.clientX + document.body.scrollLeft - boudRect.left;
        y = e.clientY + document.body.scrollTop - boudRect.top;
        holding = true;
        
        // Draw with selected tool
            
        draw(x,y,drawTool,drawColor,drawSize);
            
        /*if (drawTool == "pencil") {
            drawPencil(x,y,drawColor,drawSize);
        }
        else if (drawTool == "spray") {
            drawSpray(x,y,drawColor,drawSize);
        }*/
        
        // Send data to server
        
        socket.emit('draw', {
            tool: drawTool,
            color: drawColor,
            size: drawSize,
            x: x,
            y: y
        });
        
    }
    if (res == 'up' || res == "out") {
        holding = false;
    }
    if (res == 'move') {
        if (holding) {
            
            // Update coordinates
            
            x = e.clientX + document.body.scrollLeft - boudRect.left;
            y = e.clientY + document.body.scrollTop - boudRect.top;
            
            // Draw with selected tool
            
            draw(x,y,drawTool,drawColor,drawSize);
            
            // Send data to server
            
            socket.emit('draw', {
                tool: drawTool,
                color: drawColor,
                size: drawSize,
                x: x,
                y: y,
            });
        }
    }
}

function playButtonPressed() {
    $("#audio-indicator").html('Loading...');
    document.getElementById("play-button").disabled = true;
    
    socket.emit('play-request');
}

function moveProgress(duration) {
  var elem = document.getElementById("progBar");   
  var idx = 0;
  var width = 0;
  var id = setInterval(frame, 250);
  function frame() {
    if (idx >= duration) {
      clearInterval(id);
    } else {
      idx = idx + 0.25;
      width = (idx / duration) * 100;
      
      elem.style.width = width + '%'; 
    }
  }
}
    
$(document).ready(function() {
    
    socket.on('draw-response', function (data) {
        draw(data.x,data.y,data.tool,data.color,data.size);
    });
    
    socket.on('play-response', function (file) {
        
        $("#audio-indicator").html('Loading...');
        document.getElementById("play-button").disabled = true;
        
        audio = new Audio(file.data);
        
        // When audio file is loaded
        audio.addEventListener('loadedmetadata', function() {
            //console.log("Playing " + file.name + ", for: " + audio.duration + "seconds.");
            //audio.play(); 
            socket.emit('play-ready');
        });
        
        
    })
    
    socket.on('play-ready-response', function (file) {
        $("#audio-indicator").html(file.name);
        audio.play();
        
        var dur = parseInt(audio.duration, 10);
        
        moveProgress(dur);
        
    });
});