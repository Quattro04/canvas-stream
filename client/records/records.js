var socket = io.connect();

var canvas;
var ctx;

var canvasData;
var records;
var clickedRecord;

var audio;
var playing = false;

var requestAnimationFrame =  
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    function(callback) {
        return setTimeout(callback, 1);
    };

var iSaved = 0;
var currTimeSaved = 0;
var animate = function () {
    // The calculations required for the step function
    var start = new Date().getTime();
    var iMax = records[clickedRecord][0].length;
    var i = iSaved;

    var step = function() {
        // Get our current progres
        var timestamp = new Date().getTime();
        var currTime = timestamp - start + currTimeSaved;
        
        // Draw all actions until currTime
        while (records[clickedRecord][0][i].time <= currTime/1000) {
            draw(records[clickedRecord][0][i].x, records[clickedRecord][0][i].y,
                 records[clickedRecord][0][i].tool, records[clickedRecord][0][i].color,
                 records[clickedRecord][0][i].size, records[clickedRecord][0][i].clicked);
            i++;
        }
        
        // If the animation hasn't finished, repeat the step.
        if (i < iMax - 1 && playing) requestAnimationFrame(step);
        else {
            iSaved = i;
            currTimeSaved = currTime;
        }
        
    };
    // Start the animation
    return step();
};

function init() {
    document.getElementById("play-button").disabled = true;
    canvas = document.getElementById('recCanv');
    
    socket.emit('get-records');
    var i = 0;
    socket.on('get-records-response', function (data) {
        data.records.forEach(function(rec) {
            $('#records-panel').append($('<div id=\"' + i + '\"></div>').html(data.records[i][1].name));
            i++;
        })
        //console.log(data.records.length);
        records = data.records;
    });
    document.getElementById("mute-button").disabled = true;
}

var first = true;
function playRecordPressed() {
        
    if (first) {

        canvas.width = records[clickedRecord][1].canW;
        canvas.height = records[clickedRecord][1].canH;
        
        canvas.style.width = records[clickedRecord][1].canW + "px";
        canvas.style.height = records[clickedRecord][1].canH + "px";
        
        ctx = canvas.getContext("2d");
        
        $("#audio-indicator").html('Loading...');
        document.getElementById("play-button").disabled = true;
    
        socket.emit('play-request');
        first = false;
    }
    else if (playing) {
        document.getElementById("play-icon").setAttribute("class", "glyphicon glyphicon-play");
        audio.pause();
        playing = false;
    }
    else {
        document.getElementById("play-icon").setAttribute("class", "glyphicon glyphicon-pause");
        audio.play();
        playing = true;
        animate();
    }
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
    }
    else if (tool == "line") {
        ctx.fillStyle = color;
        for (var i = size + 100; i--; ) {
            if (i % 5 == 0) {
                ctx.fillRect(xC, yC + i, 2, 2);
                ctx.fillRect(xC, yC - i, 2, 2);
            }
        }
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

$(document).ready(function() {
    $('#records-panel').on("click", function (event) {
        if (event.target == this) return;
        clickedRecord = event.target.id;
        document.getElementById("play-button").disabled = false;
    });
    
    socket.on('play-response', function (file) {
        
        audio = new Audio(file.data);
        
        audio.onended = function() {
            
        };
        
        document.getElementById("mute-button").disabled = false;
        document.getElementById("play-button").disabled = false;
        document.getElementById("play-icon").setAttribute("class", "glyphicon glyphicon-pause");
        audio.play();
        moveProgress();
        playing = true;
        animate();
    });
});