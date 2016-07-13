var socket = io.connect();

var canvas, pickerCanvas, liveFeed, ctx, holding, flag = false;
var canvasWidth, canvasHeight;
var colorHolding = false;
var selThick = "1";
var selTool = "1";

var boudRect;
var pickerBoudRect;
var imageData;

var drawColor = "black";
var drawPercent = 1;
//var drawSize = 1;
var drawTool = "hLine";
var drawAngle = 0;
var lineCounter = 0;

var savedDrawPercent;

var audio;
var randAngle;
var randNums;

var x;
var y;
var stepsCounter = 0;
var stepsX = []
var stepsY = []
var deltaX;
var deltaY;

function init() {
    pickerCanvas = document.getElementById('color-picker-canvas');
    
    pickerCanvas.width = 256;
    pickerCanvas.height = 560;
    
    var context = pickerCanvas.getContext('2d');
    var imageObj = new Image();
    
    imageObj.onload = function() {
        context.drawImage(imageObj, 0, 0);
        context.crossOrigin = "Anonymous";
        imageData = context.getImageData(0,0,256,560);
    };
    imageObj.crossOrigin="anonymous";
    //imageObj.src = 'https://dl.dropboxusercontent.com/s/rp1hndpzpccqblz/spectrum.png';
    imageObj.src = '/images/colorpallete.jpg';
    
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
    
    // Converts RGB to HSL and uses H and S for base values, while changing L, then presenting these colors in left panel where user can change brightness.
    
    var hslVal = rgbToHsl(r,g,b);
    
    var brightnessCol = document.getElementById('brightness-column');
    var brElements = brightnessCol.childNodes;
    
    // If the selected color is shade of gray (if all rgb values are less than 10 points apart), if it is, just set brightness column to gray palette
    if (Math.abs(r-g) < 10 && Math.abs(r-b) < 10 && Math.abs(g-b) < 10) {
        for (var i = 0; i < 13; i++) {
            brElements[(i*2)+1].style.backgroundColor = "hsl(" + 0 + "," + 0 + "%," + (i/12)*100 + "%)";
        }
    }
    else {
        for (var i = 0; i < 13; i++) {
            brElements[(i*2)+1].style.backgroundColor = "hsl(" + hslVal[0]*360 + "," + hslVal[1]*100 + "%," + (i/12)*100 + "%)";
        }
    }
    
    //console.log(drawPercent);
    
    
    //document.getElementById('show-color').style.backgroundColor = "hsl(" + hslVal[0]*360 + "," + hslVal[1]*100 + "%," + 50 + "%)";
    
    
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

function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}

/*function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}*/

function thick1()  { drawPercent = 1; savedDrawPercent = 1; selectedThick(1); }
function thick2()  { drawPercent = 2; savedDrawPercent = 2; selectedThick(2); }
function thick3()  { drawPercent = 3; savedDrawPercent = 3; selectedThick(3); }
function thick4()  { drawPercent = 4; savedDrawPercent = 4; selectedThick(4); }
function thick5()  { drawPercent = 5; savedDrawPercent = 5; selectedThick(5); }
function thick6()  { drawPercent = 7; savedDrawPercent = 7; selectedThick(6); }
function thick7()  { drawPercent = 10; savedDrawPercent = 10; selectedThick(7); }
function thick8()  { drawPercent = 13; savedDrawPercent = 13; selectedThick(8); }
function thick9()  { drawPercent = 16; savedDrawPercent = 16; selectedThick(9); }
function thick10() { drawPercent = 20; savedDrawPercent = 20; selectedThick(10); }
function thick11() { drawPercent = 25; savedDrawPercent = 25; selectedThick(11); }
function thick12() { drawPercent = 30; savedDrawPercent = 30; selectedThick(12); }
function thick13() { drawPercent = 35; savedDrawPercent = 35; selectedThick(13); }
function thick14() { drawPercent = 40; savedDrawPercent = 40; selectedThick(14); }
function thick15() { drawPercent = 45; savedDrawPercent = 45; selectedThick(15); }
function thick16() { drawPercent = 50; savedDrawPercent = 50; selectedThick(16); }
function thick17() { drawPercent = 55; savedDrawPercent = 55; selectedThick(17); }
function thick18() { drawPercent = 60; savedDrawPercent = 60; selectedThick(18); }
function thick19() { drawPercent = 80; savedDrawPercent = 80; selectedThick(19); }
function thick20() { drawPercent = 100; savedDrawPercent = 100; selectedThick(20); }
function thick21() { drawPercent = 200; savedDrawPercent = 200; selectedThick(21); }

function selectedThick(val) {
    var selT = "thick" + selThick;
    document.getElementById(selT).style.backgroundColor = "white";
    document.getElementById(selT).style.color = "black";
    
    selT = "thick" + val;
    document.getElementById(selT).style.backgroundColor = "black";
    document.getElementById(selT).style.color = "white";
    selThick = val;
}

function bright1()  { selectedBright(1); }
function bright2()  { selectedBright(2); }
function bright3()  { selectedBright(3); }
function bright4()  { selectedBright(4); }
function bright5()  { selectedBright(5); }
function bright6()  { selectedBright(6); }
function bright7()  { selectedBright(7); }
function bright8()  { selectedBright(8); }
function bright9()  { selectedBright(9); }
function bright10() { selectedBright(10); }
function bright11() { selectedBright(11); }
function bright12() { selectedBright(12); }
function bright13() { selectedBright(13); }

function selectedBright(val) {
    var selB = document.getElementById("bright" + val);
    document.getElementById('show-color').style.backgroundColor = selB.style.backgroundColor;
    drawColor = selB.style.backgroundColor;
}

function tool1() { drawTool = "hLine"; selectedTool(1); }
function tool2() { drawTool = "rLine"; selectedTool(2); }
function tool3() { drawTool = "sprayLine"; selectedTool(3); }
function tool4() { drawTool = "spray"; selectedTool(4); }
function tool5() { drawTool = "brushInc"; selectedTool(5); }
function tool6() { drawTool = "brushIncSprayed"; selectedTool(6); }
function tool7() { drawTool = "brushDec"; selectedTool(7); }
function tool8() { drawTool = "brushDecSprayed"; selectedTool(8); }
function tool9() { drawTool = "fullRoundSpray"; selectedTool(9); }
function tool10() { drawTool = "stripedRoundSpray"; selectedTool(10); }
function tool11() { drawTool = "blackedSpray"; selectedTool(11); }
function tool12() { drawTool = "blackedSpraySquare"; selectedTool(12); }
function tool13() { drawTool = "brush"; selectedTool(13); }
function tool14() { drawTool = "transparent"; selectedTool(14); }

function selectedTool(val) {
    var selT = "toolLab" + selTool;
    document.getElementById(selT).style.backgroundColor = "white";
    document.getElementById(selT).style.color = "black";
    
    selT = "toolLab" + val;
    document.getElementById(selT).style.backgroundColor = "black";
    document.getElementById(selT).style.color = "white";
    selTool = val;
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
        console.log(percent);
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

function findxy(res, e) {
    if(!drawPercent) drawPercent = 1;

    if (res == 'down') {
        
        //console.log(drawPercent,drawColor);
        
        x = e.clientX + document.body.scrollLeft - boudRect.left;
        y = e.clientY + document.body.scrollTop - boudRect.top;
        holding = true;
        
        // Draw with selected tool
            

        draw(x,y,drawTool,drawColor,drawPercent,drawAngle,true);

        
        // Send data to server
        socket.emit('draw', {
            x: x,
            y: y,
            tool: drawTool,
            color: drawColor,
            size: drawPercent,
            clicked: true,
            time: audio.currentTime
        });
        
        savedDrawPercent = drawPercent;
        
        if (drawTool == "brushInc" || drawTool == "brushIncSprayed") {
            drawPercent = 1;
        }
        
    }
    if (res == 'up' || res == "out") {
        holding = false;
        drawPercent = savedDrawPercent;
    }
    if (res == 'move') {
        
        // Update coordinates
        x = e.clientX + document.body.scrollLeft - boudRect.left;
        y = e.clientY + document.body.scrollTop - boudRect.top;
        
        stepsX[stepsCounter] = x;
        stepsY[stepsCounter] = y;
        
        if (holding) {
            
            if (stepsCounter != 4 && (drawTool == "fullRoundSpray" || drawTool == "stripedRoundSpray")) {  // Occurs every 5 steps
                stepsCounter++;
                return;
            }
            
            if (drawTool == "rLine" || drawTool == "sprayLine") {
               // if (drawTool == "rLine" || drawTool == "sprayLine") {
                    /*if (lineCounter < 5) {
                        lineCounter++;
                        return;
                    }
                    lineCounter = 0;*/
                //}
                if (stepsCounter == 4) {
                    deltaX = x - stepsX[0];
                    deltaY = y - stepsY[0];
                }
                else {
                    deltaX = x - stepsX[stepsCounter+1];
                    deltaY = y - stepsY[stepsCounter+1];
                }
                drawAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            }
            
            if (drawTool == "brushDec" || drawTool == "brushDecSprayed") {
                if (drawPercent > 1) {
                    drawPercent = drawPercent - 0.01;
                }
            }
            else if (drawTool == "brushInc" || drawTool == "brushIncSprayed") {
                if (drawPercent < savedDrawPercent) {
                    drawPercent = drawPercent + 0.01;
                }
            }
            
            
            drawAndEmit(); 
        }
        stepsCounter++;
        if (stepsCounter == 5) {
            x5stepsB = x;
            y5stepsB = y;
            stepsCounter = 0;
        }
    }
}

function drawAndEmit() {
    draw(x,y,drawTool,drawColor,drawPercent,drawAngle,false);
            
    // Send data to server
    socket.emit('draw', {
        x: x,
        y: y,
        tool: drawTool,
        color: drawColor,
        size: drawPercent,
        clicked: false,
        time: audio.currentTime
    });
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


    
$(document).ready(function() {
    
    socket.on('canvas-init-response', function (data) {
        
        //console.log(data.randAngle,data.randNums);
        randNums = data.randNums;
        randAngle = data.randAngle;
        
        canvas.width = data.canW;
        canvas.height = data.canH;
        
        canvasWidth = data.canW;
        canvasHeight = data.canH;
        
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
    
        // Gray shades for brightness column
        var brightnessCol = document.getElementById('brightness-column');
        var brElements = brightnessCol.childNodes;
        for (var i = 0; i < 13; i++) {
            brElements[(i*2)+1].style.backgroundColor = "hsl(0,0%," + (i/12)*100 + "%)";
        }
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
            //window.location.href = url;
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




