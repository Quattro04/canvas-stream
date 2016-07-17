var socket = io.connect();

var canvas;
var ctx;
var specSession;

var randNums;
var randAngle;

var canvasWidth, canvasHeight;

function init() {
    var urlString = window.location.href;

    urlParams = parseURLParams(urlString);
    
    canvas = document.getElementById('canv');
    
    canvas.width = urlParams.canW[0];
    canvas.height = urlParams.canH[0];
    
    canvas.style.width = urlParams.canW[0] + "px";
    canvas.style.height = urlParams.canH[0] + "px";
    
    canvasWidth = urlParams.canW[0];
    canvasHeight = urlParams.canH[0];
    
    ctx = canvas.getContext("2d");
    
    specSession = urlParams.ses[0];
    
    socket.emit('spectate-req', { sessionID: specSession });
    
}

function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
        queryEnd   = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;

    if (query === url || query === "") {
        return;
    }

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=");
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)) {
            parms[n] = [];
        }

        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}

var sprayNum = 0;
function draw(xC,yC,tool,color,size,angle,clicked) {
    
    if (tool == "hLine") {
        size = (size/100) * canvasWidth;
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(xC-(size/2),yC);
        ctx.lineTo(xC+(size/2),yC);
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    else if (tool == "rLine") {
        if (clicked) return;
        
        size = ((size/100) * canvasHeight) * 2;
        angle = angle + 90;
        var cos = Math.cos(Math.PI * angle / 180.0);
        var sin = Math.sin(Math.PI * angle / 180.0);
        
        ctx.beginPath();
        ctx.lineWidth = 1;
        
        ctx.moveTo(xC - size/2 * cos, yC - size/2 * sin); ctx.lineTo(xC - (size/2-size/50) * cos, yC - (size/2-size/50) * sin);
        ctx.moveTo(xC + size/2 * cos, yC + size/2 * sin); ctx.lineTo(xC + (size/2-size/50) * cos, yC + (size/2-size/50) * sin);
        
        ctx.moveTo(xC - (size/2-size/20) * cos, yC - (size/2-size/20) * sin); ctx.lineTo(xC - (size/2-size/15) * cos, yC - (size/2-size/15) * sin);
        ctx.moveTo(xC + (size/2-size/20) * cos, yC + (size/2-size/20) * sin); ctx.lineTo(xC + (size/2-size/15) * cos, yC + (size/2-size/15) * sin);
        
        ctx.moveTo(xC - (size/2-size/10) * cos, yC - (size/2-size/10) * sin); ctx.lineTo(xC - (size/2-size/6.5) * cos, yC - (size/2-size/6.5) * sin);
        ctx.moveTo(xC + (size/2-size/10) * cos, yC + (size/2-size/10) * sin); ctx.lineTo(xC + (size/2-size/6.5) * cos, yC + (size/2-size/6.5) * sin);
        
        ctx.moveTo(xC - (size/2-size/5.5) * cos, yC - (size/2-size/5.5) * sin); ctx.lineTo(xC - (size/2-size/3.5) * cos, yC - (size/2-size/3.5) * sin);
        ctx.moveTo(xC + (size/2-size/5.5) * cos, yC + (size/2-size/5.5) * sin); ctx.lineTo(xC + (size/2-size/3.5) * cos, yC + (size/2-size/3.5) * sin);
        
        ctx.moveTo(xC - (size/5.4) * cos, yC - (size/5.4) * sin); ctx.lineTo(xC + (size/5.4) * cos, yC + (size/5.4) * sin);
        
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    else if (tool == "sprayLine") {
        
        var percent = size;
        size = (size/100) * canvasWidth;
        
        ctx.fillStyle = color;
        for (var i = size; i > 0; i--) {
            var x = (randNums[sprayNum] / 1000) * size/2;
            var y = (randNums[sprayNum+1] / 1000) * size/2;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            if (Math.abs(y) < size/6 || percent == 200) ctx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
         
    }
    else if (tool == "spray") {
        
        size = ((size/100) * canvasWidth) / 2;
        
        ctx.fillStyle = color;
        for (var i = size; i > 0; i--) {
            var angle = randAngle[sprayNum];
            var radius = (randNums[sprayNum] / 1000) * size;
            ctx.fillRect(xC + radius * Math.cos(angle), yC + radius * Math.sin(angle), 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
    }
    else if (tool == "brushInc" || tool == "brushDec" || tool == "brushIncSprayed" || tool == "brushDecSprayed") {
        
        size = (size/100) * canvasWidth;
        
        if (clicked) {
            ctx.beginPath();
            ctx.moveTo(xC,yC);
            ctx.fillStyle = color;
        }
        else {
            ctx.lineTo(xC,yC);
            ctx.lineWidth = size;
            ctx.lineJoin = ctx.lineCap = 'round';
            ctx.strokeStyle = color;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(xC,yC);
            
            for (var i = size*5; i > 0; i--) {
                var angle = randAngle[sprayNum];
                var radius = (randNums[sprayNum] / 1000) * (size/1.5);
                ctx.fillRect(xC + radius * Math.cos(angle), yC + radius * Math.sin(angle), 1, 1);
                
                sprayNum = sprayNum + 2;
                if (sprayNum >= 10000) sprayNum = 0;
            }
            
            ctx.beginPath();
            ctx.moveTo(xC,yC);
            
            if (tool == "brushIncSprayed" || tool == "brushDecSprayed") {
                 for (var i = size*2; i > 0; i--) {
                    var angle = randAngle[sprayNum];
                    var radius = (randNums[sprayNum] / 1000) * (size*1.2);
                    ctx.fillRect(xC + radius * Math.cos(angle), yC + radius * Math.sin(angle), 1, 1);
                    
                    sprayNum = sprayNum + 2;
                    if (sprayNum >= 10000) sprayNum = 0;
                }
            }
        }
    }
    else if (tool == "fullRoundSpray") {
        
        size = ((size/100) * canvasWidth) / 2;
        
        ctx.beginPath();
        ctx.arc(xC,yC,size,0,2*Math.PI);
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        
        ctx.stroke();
        
        for (var i = size*5; i > 0; i--) {
            var x = (randNums[sprayNum] / 1000) * size;
            var y = (randNums[sprayNum+1] / 1000) * size;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            if (Math.abs(x) + Math.abs(y) < size * 1.4) ctx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
    }
    else if (tool == "stripedRoundSpray") {
        
        size = ((size/100) * canvasWidth) / 2;

        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        for (var i = 3; i <= 32; i = i+4) {
            ctx.beginPath();
            ctx.arc(xC,yC,size,(i/16)*Math.PI,((i+2)/16)*Math.PI);
            ctx.stroke();
        }
        
        for (var i = size*5; i > 0; i--) {
            var x = (randNums[sprayNum] / 1000) * size;
            var y = (randNums[sprayNum+1] / 1000) * size;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            if (Math.abs(x) + Math.abs(y) < size * 1.4) ctx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
    }
    else if (tool == "blackedSpray") {
        
        size = ((size/100) * canvasWidth) / 2;
        
        ctx.fillStyle = color;
        
        for (var i = size; i > 0; i = i-2) {
            var x = (randNums[sprayNum] / 1000) * size;
            var y = (randNums[sprayNum+1] / 1000) * size;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            if (Math.abs(x) + Math.abs(y) < size * 1.4) ctx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
        
        ctx.fillStyle = 'black';
        for (var i = size; i > 0; i = i-2) {
            var angle = randAngle[sprayNum];
            var radius = (randNums[sprayNum] / 1000) * size;
            ctx.fillRect(xC + radius * Math.cos(angle), yC + radius * Math.sin(angle), 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
    }
    else if (tool == "blackedSpraySquare") {
        
        size = ((size/100) * canvasWidth) / 2;
        
        ctx.fillStyle = color;
        
        for (var i = size; i > 0; i = i-2) {
            var x = (randNums[sprayNum] / 1000) * size;
            var y = (randNums[sprayNum+1] / 1000) * size;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            ctx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
        
        ctx.fillStyle = 'black';
        
        for (var i = size; i > 0; i = i-2) {
            var x = (randNums[sprayNum] / 1000) * size;
            var y = (randNums[sprayNum+1] / 1000) * size;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            ctx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
    }
    else if (tool == "brush") {
        
        size = (size/100) * canvasWidth;
        
        if (clicked) {

            ctx.beginPath();
            ctx.arc(xC,yC,size/2,0,2*Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            
            ctx.beginPath();
            ctx.lineWidth = size;
            ctx.lineJoin = ctx.lineCap = 'round';
            ctx.strokeStyle = color;
            ctx.moveTo(xC,yC);
            ctx.lineTo(xC,yC);
        }
        else {
            ctx.lineTo(xC,yC);
            ctx.stroke();
        }
    }
    else if (tool == "transparent") {
        
        ctx.beginPath();
        ctx.arc(xC, yC, size, 0, 2*Math.PI, false);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fill();
        
    }
}

$(document).ready(function() {
    
    socket.on('draw-response', function (data) {
        draw(data.x,data.y,data.tool,data.color,data.size,data.angle,data.clicked);
    });
    
    socket.on('spectate-res', function (data) {
        randNums = data.randNums;
        randAngle = data.randAngle;
    });
});

$(window).unload(function() {
    socket.emit('leaving-spec', { sessionID: specSession });
});