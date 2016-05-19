var socket = io.connect();

var canvas, pickerCanvas, liveFeed, ctx, holding, flag = false;
var colorHolding = false;
var selThick = "1";

var boudRect;
var pickerBoudRect;
var imageData;

var drawColor = "black";
var drawSize = 1;
var drawTool = "brush";

var audio;

function init() {
    pickerCanvas = document.getElementById('color-picker-canvas');
    
    pickerCanvas.width = 256;
    pickerCanvas.height = 256;
    
    var context = pickerCanvas.getContext('2d');
    var imageObj = new Image();
    
    imageObj.onload = function() {
        context.drawImage(imageObj, 0, 0);
        context.crossOrigin = "Anonymous";
        imageData = context.getImageData(0,0,256,256);
    };
    imageObj.crossOrigin="anonymous";
    imageObj.src = 'https://dl.dropboxusercontent.com/s/rp1hndpzpccqblz/spectrum.png';
    
    pickerBoudRect = pickerCanvas.getBoundingClientRect();
    
    pickerCanvas.addEventListener("mousemove", function (e) {
        pickColor('move', e);
    }, false);
    pickerCanvas.addEventListener("mousedown", function (e) {
        pickColor('down', e);
    }, false);
    pickerCanvas.addEventListener("mouseup", function (e) {
        pickColor('up', e);
    }, false);
    pickerCanvas.addEventListener("mouseout", function (e) {
        pickColor('out', e);
    }, false);
    
    
    
    
    
    canvas = document.getElementById('canv');
    
    socket.emit('canvas-init');
    
    //canvas.disabled = true;
    document.getElementById("mute-button").disabled = true;
}

function pickColor(res, e) {
    
    if (res == 'down') {
        var xCoord = e.clientX + document.body.scrollLeft - pickerBoudRect.left;
        var yCoord = e.clientY + document.body.scrollTop - pickerBoudRect.top;
        
        getColor(xCoord,yCoord);
        colorHolding = true;
    }
    if (res == 'up' || res == "out") {
        colorHolding = false;
    }
    if (res == 'move') {
        if (colorHolding) {
            var xCoord = e.clientX + document.body.scrollLeft - pickerBoudRect.left;
            var yCoord = e.clientY + document.body.scrollTop - pickerBoudRect.top;
            getColor(xCoord,yCoord);
        }
    }
}

function getColor(xCoord,yCoord) {
    var index = (256 * 4 * yCoord) + (xCoord * 4);
    var r = imageData.data[index-4];
    var g = imageData.data[index-3];
    var b = imageData.data[index-2];
    document.getElementById('show-color').style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
    document.getElementById('red').value = r;
    document.getElementById('green').value = g;
    document.getElementById('blue').value = b;
    
    drawColor = rgbToHex(r,g,b);
}

function rgbChanged() {
    var r = document.getElementById('red').value;
    var g = document.getElementById('green').value;
    var b = document.getElementById('blue').value;
    
    if (isNaN(r) || r == "") {
        document.getElementById('red').value = "0";
    }
    if (isNaN(g) || g == "") {
        document.getElementById('green').value = "0";
    }
    if (isNaN(b) || b == "") {
        document.getElementById('blue').value = "0";
    }
    
    r = document.getElementById('red').value;
    g = document.getElementById('green').value;
    b = document.getElementById('blue').value;
    
    drawColor = rgbToHex(r,g,b);
    document.getElementById('show-color').style.backgroundColor = drawColor;
}

function thick1() {
    drawSize = 1;
    selectedThick(1);
}
function thick2() {
    drawSize = 10;
    selectedThick(2);
}
function thick3() {
    drawSize = 25;
    selectedThick(3);
}
function thick4() {
    drawSize = 50;
    selectedThick(4);
}
function thick5() {
    drawSize = 75;
    selectedThick(5);
}
function thick6() {
    drawSize = 125;
    selectedThick(6);
}
function thick7() {
    drawSize = 200;
    selectedThick(7);
}
function thick8() {
    drawSize = 300;
    selectedThick(8);
}
function thick9() {
    drawSize = 450;
    selectedThick(9);
}
function thick10() {
    drawSize = 600;
    selectedThick(10);
}

function selectedThick(val) {
    var selT = "thickLab" + selThick;
    console.log(selT);
    document.getElementById(selT).style.backgroundColor = "white";
    document.getElementById(selT).style.color = "black";
    
    selT = "thickLab" + val;
    document.getElementById(selT).style.backgroundColor = "black";
    document.getElementById(selT).style.color = "white";
    selThick = val;
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

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
    
    socket.on('canvas-init-response', function (data) {
    
        canvas.width = data.canW;
        canvas.height = data.canH;
        
        canvas.style.width = data.canW + "px";
        canvas.style.height = data.canH + "px";
        
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
        
        var margin = parseInt(data.canW) + 60;
       // document.getElementById("right-panel").style.marginLeft = margin + "px";
        pickerBoudRect = pickerCanvas.getBoundingClientRect();
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



