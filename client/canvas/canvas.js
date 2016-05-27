var socket = io.connect();

var canvas, pickerCanvas, liveFeed, ctx, holding, flag = false;
var colorHolding = false;
var selThick = "1";
var selTool = "1";

var boudRect;
var pickerBoudRect;
var imageData;

var drawColor = "black";
var drawSize = 1;
var drawTool = "pencil";

var savedDrawSize;

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
    document.getElementById('show-color').style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
}

function thick1() {
    drawSize = 1;
    savedDrawSize = 1;
    selectedThick(1);
}
function thick2() {
    drawSize = 10;
    savedDrawSize = 10;
    selectedThick(2);
}
function thick3() {
    drawSize = 25;
    savedDrawSize = 25;
    selectedThick(3);
}
function thick4() {
    drawSize = 50;
    savedDrawSize = 50;
    selectedThick(4);
}
function thick5() {
    drawSize = 75;
    savedDrawSize = 75;
    selectedThick(5);
}
function thick6() {
    drawSize = 100;
    savedDrawSize = 100;
    selectedThick(6);
}
function thick7() {
    drawSize = 150;
    savedDrawSize = 150;
    selectedThick(7);
}
function thick8() {
    drawSize = 300;
    savedDrawSize = 300;
    selectedThick(8);
}
function thick9() {
    drawSize = 450;
    savedDrawSize = 450;
    selectedThick(9);
}
function thick10() {
    drawSize = 600;
    savedDrawSize = 600;
    selectedThick(10);
}

function selectedThick(val) {
    var selT = "thickLab" + selThick;
    document.getElementById(selT).style.backgroundColor = "white";
    document.getElementById(selT).style.color = "black";
    
    selT = "thickLab" + val;
    document.getElementById(selT).style.backgroundColor = "black";
    document.getElementById(selT).style.color = "white";
    selThick = val;
}

function tool1() {
    drawTool = "pencil";
    selectedTool(1);
}
function tool2() {
    drawTool = "brush";
    selectedTool(2);
}
function tool3() {
    drawTool = "line";
    selectedTool(3);
}
function tool4() {
    selectedTool(4);
}
function tool5() {
    selectedTool(5);
}
function tool6() {
    selectedTool(6);
}
function tool7() {
    selectedTool(7);
}
function tool8() {
    selectedTool(8);
}
function tool9() {
    selectedTool(9);
}
function tool10() {
    selectedTool(10);
}
function tool11() {
    selectedTool(11);
}
function tool12() {
    selectedTool(12);
}
function tool13() {
    selectedTool(13);
}
function tool14() {
    selectedTool(14);
}
function selectedTool(val) {
    var selT = "toolLab" + selTool;
    document.getElementById(selT).style.backgroundColor = "white";
    document.getElementById(selT).style.color = "black";
    
    selT = "toolLab" + val;
    document.getElementById(selT).style.backgroundColor = "black";
    document.getElementById(selT).style.color = "white";
    selTool = val;
}


function draw(xC,yC,tool,color,size,clicked) {
    if (tool == "pencil" || tool == "brush") {
        if (clicked) {
            ctx.beginPath();
            ctx.lineWidth = size;
            ctx.lineJoin = ctx.lineCap = 'round';
            ctx.moveTo(xC,yC);
        }
        else {
            ctx.lineWidth = size;
            ctx.lineTo(xC,yC);
            ctx.strokeStyle = color;
            ctx.stroke();
        }
        /*ctx.beginPath();
        ctx.arc(xC,yC,size,0,2*Math.PI);
        ctx.fillStyle = color;
        ctx.fill();*/
    }
    else if (tool == "line") {
        ctx.beginPath();
        ctx.fillStyle = color;
        for (var i = size + 100; i--; ) {
            if (i % 5 == 0) {
                ctx.fillRect(xC, yC + i, 2, 2);
                ctx.fillRect(xC, yC - i, 2, 2);
            }
        }
        /*ctx.lineJoin = ctx.lineCap = 'round';
        ctx.moveTo(xC,yC-100);
        ctx.lineWidth = size;
        ctx.lineTo(xC,yC+100);
        ctx.strokeStyle = color;
        ctx.stroke();*/
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
            clicked: true,
            time: audio.currentTime
        });
        
        savedDrawSize = drawSize;
        //socket.emit('canvas-shot', { img : img });
        
    }
    if (res == 'up' || res == "out") {
        holding = false;
        drawSize = savedDrawSize;
    }
    if (res == 'move') {
        if (holding) {
            
            // Update coordinates
            
            x = e.clientX + document.body.scrollLeft - boudRect.left;
            y = e.clientY + document.body.scrollTop - boudRect.top;
            
            if(drawTool == "brush") {
                if (drawSize > 1) {
                    drawSize = drawSize - (savedDrawSize/100);
                }
            }
            
            draw(x,y,drawTool,drawColor,drawSize,false);
            
            // Send data to server

            socket.emit('draw', {
                x: x,
                y: y,
                tool: drawTool,
                color: drawColor,
                size: drawSize,
                clicked: false,
                time: audio.currentTime
            });
        }
    }
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
        } 
        else {
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
        
        pickerBoudRect = pickerCanvas.getBoundingClientRect();
        
        
        // Request to start audio
        $("#audio-indicator").html('Loading...');
        document.getElementById("play-button").disabled = true;
    
        socket.emit('play-request');
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
            
            /*document.getElementById("play-button").disabled = false;
            document.getElementById("progBar").style.width = "0%";
            document.getElementById("mute-icon").setAttribute("class", "glyphicon glyphicon-volume-up");
            document.getElementById("mute-button").disabled = true;*/
            
            var url = window.location.href;
            url = url.slice(0,-7);
            url = url + "new";
            window.location.href = url;
            
            
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
    
    /*socket.on('newUser-audio', function (data) {
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
    });*/
    
});




