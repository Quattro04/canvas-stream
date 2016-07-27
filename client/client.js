var socket = io.connect();

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------
// NEW SESSION
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------

var socketID;
var mySessionID;
var myUserNum;
var meConductor = false;
var inSolo = false;

var soloName;
var soloBG;

function init() {
    
}

function goHome() {
    window.location.href = "/";
}

function uploadMusic() {
    $('#upload-popup').modal('show');
     socket.emit('music-refresh-req');
}

var upload = false;
function selectedFile(obj) {
    if (!obj.files[0]) {
        document.getElementById('upload-button').disabled = true;
        return;
    }
    var fileType = obj.files[0].type;
    if (fileType.indexOf('audio') == -1) {
        document.getElementById('upload-button').disabled = true;
        return;
    }
    
    var player = document.getElementById('audio-player');
    var reader = new FileReader();
    reader.onload = (
        function(audio) {
            return function(e) {
                audio.src = e.target.result;
            ;};
        })(player);
    reader.addEventListener('load', function() {
        if (!upload) document.getElementById('upload-button').disabled = false;
        //document.getElementById("audio-player").play();
    });
    reader.readAsDataURL(obj.files[0]);
}

function uploadFile() {
    var name;
    
    // Extract filename from input
    var fullPath = document.getElementById('audio-input').value;
    if (fullPath) {
        var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
        var filename = fullPath.substring(startIndex);
        if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
            filename = filename.substring(1);
        }
        name = filename;
    }
    upload = true;
    var audio = document.getElementById('audio-player').src;
    document.getElementById('loading-icon').style.visibility = "visible";
    document.getElementById('upload-button').disabled = true;
    socket.emit('file-upload',{ file:audio, name:name });
}

var prevMusic;
var selectedMusic;
function selectMusic(val) {
    
    if (prevMusic == val) return;
    
    document.getElementById(val).style.backgroundColor = "#99C3D1";
    if (prevMusic) {
        document.getElementById(prevMusic).style.backgroundColor = "#FFFFFF";
    }
    prevMusic = val;
    selectedMusic = val.slice(-1);
    document.getElementById("start-session-button").disabled = false;
}
var soloPrevMusic;
var soloSelectedMusic;
function soloSelectMusic(val) {
    if (soloPrevMusic == val) return;
    
    document.getElementById(val).style.backgroundColor = "#99C3D1";
    if (soloPrevMusic) {
        document.getElementById(soloPrevMusic).style.backgroundColor = "#FFFFFF";
    }
    soloPrevMusic = val;
    soloSelectedMusic = val.slice(-1);
    document.getElementById("start-solo-session-button").disabled = false;
}

function liveSession() {
    document.getElementById("main-homepage").style.display = "none";
    document.getElementById("main-live-session").style.display = "block";
    
    socket.emit('join-refresh-req');
    
    document.getElementById("users-panel-body").innerHTML = "<p style=\"margin-left:15px;margin-top:15px;\">Join or create a room</p>";
    document.getElementById("chat-panel-body").innerHTML = "<p>Join or create a room</p>";
    document.getElementById("username-input").disabled = true;
    document.getElementById("message-input").disabled = true;
    document.getElementById("new-room-input").disabled = false;
    document.getElementById("footer").style.visibility = "hidden";
}                                                               
function liveSessionToHome() {
    document.getElementById("main-live-session").style.display = "none";
    document.getElementById("main-homepage").style.display = "block";
    
    if (mySessionID != null) {
        socket.emit('leaving-new', { sessionID: mySessionID, user: myUserNum });
    }
    mySessionID = null;
}
function solo() {
    clearText();
    $('#solo-popup').modal('show');
    socket.emit('music-refresh-req');
}
function startSoloSession() {
    var nameBox =  document.getElementById("solo-name-input");
    if (nameBox.value == "" || nameBox.value == "Enter a name.") {
        nameBox.value = "Enter a name.";
        nameBox.style.color = "#ff4d4d";
        return;
    }
    
    soloName = nameBox.value;
    
    $('#solo-popup').modal('hide');
    $('#loading-popup').modal('show');
    document.getElementById("play-button").disabled = true;
    document.getElementById("undo-button").disabled = true;
    document.getElementById("whole-pic-button").style.display = "none";
    document.getElementById("solo-bar").style.display = "block";
    
    var e = document.getElementById("solo-size-selector");
    var res = e.options[e.selectedIndex].text;
    var resArr = res.split(" ");
    
    e = document.getElementById("solo-bg-selector");
    soloBG = e.options[e.selectedIndex].value;
    
    document.getElementById("main-homepage").style.display = "none";
    document.getElementById("main-live-canvas").style.display = "block";
        
    socket.emit('solo-init',{ audio:soloSelectedMusic });
    
    // Init canvas
    
    canvas = document.getElementById('canv');
    
    canvas.width = resArr[0];
    canvas.height = resArr[2];
    
    canvasWidth = resArr[0];
    canvasHeight = resArr[2];
    
    canvas.style.width = resArr[0] + "px";
    canvas.style.height = resArr[2] + "px";
    
    ctx = canvas.getContext("2d");
    
    if (soloBG == 1) {
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    else if (soloBG == 2) {
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
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
    
    // Init color picker
    
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
    
    // Gray shades for brightness column
    
    var brightnessCol = document.getElementById('brightness-column');
    var brElements = brightnessCol.childNodes;
    for (var i = 0; i < 13; i++) {
        brElements[(i*2)+1].style.backgroundColor = "hsl(0,0%," + (i/12)*100 + "%)";
    }
    
    inSolo = true;
    document.getElementById("footer").style.visibility = "hidden";
}
function clearText() {
    var nameBox =  document.getElementById("solo-name-input");
    nameBox.value = "";
    nameBox.style.color = "#000000";
}
function playButtonPressed() {
    if (inSolo) {
        if (playing) {
            document.getElementById("play-icon").setAttribute("class", "glyphicon glyphicon-play");
            audio.pause();
            playing = false;
        }
        else {
            document.getElementById("play-icon").setAttribute("class", "glyphicon glyphicon-pause");
            audio.play();
            playing = true;
        }
        soloMoveProgress();
    }
}
function soloMoveProgress() {
    var elem = document.getElementById("progBar");   
    var idx = 0;
    var width = 0;
    var id = setInterval(frame, 250);
    var i = 0;
    
    function frame() {
        if (audio.currentTime == audio.duration) {
            clearInterval(id);
        } 
        else {
            /*for (var j = 0; j < layers.length; j++) {
                while(layers[j][i].time < audio.currentTime) {
                    draw(layers[j][i].x,layers[j][i].y,layers[j][i].tool,layers[j][i].color,layers[j][i].size,layers[j][i].angle,layers[j][i].clicked);
                    i++;
                }
                i = 0;
            }*/
            width = (audio.currentTime / audio.duration) * 100;
            elem.style.width = width + '%'; 
        }
    }
}
function undo() {
    savedActionIdx--;
    audio.currentTime = savedCurrTime;
    
    actions = actions.slice(0,savedActionIdx);
    actionIdx = savedActionIdx;

    redrawAll();
    document.getElementById("undo-button").disabled = true;
}
function redrawAll(time) {
    
    // Draw all visible layers
    
    if (soloBG == 1) {
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    else if (soloBG == 2) {
        ctx.fillStyle = "rgb(255,255,255)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    for (var i = 0; i < layers.length; i++) {
        if (!layers[i].visible) continue;
        sprayNum = 0;
        for (var j = 0; j < layers[i].actions.length; j++) {
            draw(layers[i].actions[j].x,layers[i].actions[j].y,layers[i].actions[j].tool,layers[i].actions[j].color,
            layers[i].actions[j].size,layers[i].actions[j].angle,layers[i].actions[j].clicked);
        }
    }
    
    // Draw current layer
    if (actions.length != 0) {
        
        sprayNum = 0;
        for (var i = 0; i < actions.length; i++) {
            draw(actions[i].x,actions[i].y,actions[i].tool,actions[i].color,actions[i].size,actions[i].angle,actions[i].clicked);
        }
    }
}
function newLayer() {
    if (actions.length == 0) return;

    var temp = actions;
    layers.push({actions:temp, visible: true});
    actions = [];
    actionIdx = 0;
    
    audio.currentTime = 0;
    audio.pause();
    sprayNum = 0;
    playing = false;
    document.getElementById("play-icon").setAttribute("class", "glyphicon glyphicon-play");
    document.getElementById("layerSel").innerHTML = "";
    
    for (var i = 0; i < layers.length; i++) {
         document.getElementById("layerSel").innerHTML = document.getElementById("layerSel").innerHTML + "<option value=\"" + i + "\">" + (i+1) + "</option>";
    }
    //document.getElementById("visible-checkbox-div").style.display = "block";
    document.getElementById("visible-checkbox").checked = true;
    document.getElementById("layerSel").selectedIndex = layers.length-1;
}
function selectedLayer() {
    var e = document.getElementById("layerSel");
    var layerNum = e.options[e.selectedIndex].value;
    
    document.getElementById("visible-checkbox").checked = layers[layerNum].visible;
}
function layerVisibilityChanged() {
    var e = document.getElementById("layerSel");
    var layerNum = e.options[e.selectedIndex].value;
    
    layers[layerNum].visible = document.getElementById("visible-checkbox").checked;
    
    redrawAll();
}
function finishSolo() {
    $('#loading-popup').modal('show');
    if (actions.length != 0) {
        var temp = actions;
        layers.push({actions:temp, visible: true});
        actions = [];
    }
    
    // Join actions of all layers and sort them by time of draw
    var joinedActions = [];
    for (var i = 0; i < layers.length; i++) {
        joinedActions = joinedActions.concat(layers[i].actions);
    }
    joinedActions.sort(function(a, b){return a.time-b.time});
    
    socket.emit('upload-record', { name:soloName, audio:soloSelectedMusic, canW:canvasWidth, canH:canvasHeight, bg:soloBG, actions:joinedActions });
    
    goHome();
}
function records() {
    document.getElementById("main-homepage").style.display = "none";
    document.getElementById("main-records").style.display = "block";
    document.getElementById("rec-mute-button").disabled = true;
    
    recCanvas = document.getElementById('rec-canv');
    document.getElementById("footer").style.visibility = "hidden";
    
    socket.emit('records-req');
}
/*function recordsToHome() {
    document.getElementById("main-records").style.display = "none";
    document.getElementById("main-homepage").style.display = "block";
}*/

function join(val) {
    socket.emit('join-room-req', { room: val });
}

function refreshRooms() {
    socket.emit('join-refresh-req');
}

function createSession() {
    $('#loading-popup').modal('show');
    
    var e = document.getElementById("size-selector");
    var res = e.options[e.selectedIndex].text;
    var resArr = res.split(" ");
    
    e = document.getElementById("bg-selector");
    res = e.options[e.selectedIndex].value;
    
    socket.emit('start-session', { session: mySessionID, width: resArr[0], height: resArr[2], audioID:selectedMusic, bg:res });
}

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CANVAS
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------

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

var actions = [];
var layers = [];
var savedCurrTime;
var actionIdx = 0;
var savedActionIdx = 0;

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

function spectate() {
    window.open("/spectate/index.html?ses=" + mySessionID + "&canW=" + canvasWidth + "&canH=" + canvasHeight, "", "width=" + canvasWidth + ",height=" + canvasHeight + ",resizable=0");
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
        
        x = e.clientX + document.body.scrollLeft - boudRect.left;
        y = e.clientY + document.body.scrollTop - boudRect.top;
        holding = true;
        
        // Solo Session --------------------------------------
        
        if (inSolo) {
            actionIdx++;
            savedActionIdx = actionIdx;
            savedCurrTime = audio.currentTime;
            
            var action = {
                x: x,
                y: y,
                tool: drawTool,
                color: drawColor,
                size: drawPercent,
                angle: drawAngle,
                clicked: true,
                time: audio.currentTime,
            }
            actions.push(action);
        }
        // ---------------------------------------------------
        
        // Draw with selected tool

        draw(x,y,drawTool,drawColor,drawPercent,drawAngle,true);
        
        // Send data to server if it's live session
        if (!inSolo) {
            socket.emit('draw', {
                x: x,
                y: y,
                tool: drawTool,
                color: drawColor,
                size: drawPercent,
                angle: drawAngle,
                clicked: true,
                time: audio.currentTime,
                session: mySessionID,
                conductor: meConductor
            });
        }
        
        savedDrawPercent = drawPercent;
        
        if (drawTool == "brushInc" || drawTool == "brushIncSprayed") {
            drawPercent = 1;
        }
        
    }
    if (res == 'up' || res == "out") {
        if (holding) {
            holding = false;
            document.getElementById("undo-button").disabled = false;
            drawPercent = savedDrawPercent;
        }
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
            
            // Solo Session --------------------------------------
            
            if (inSolo) {
                actionIdx++;
            
                var action = {
                    x: x,
                    y: y,
                    tool: drawTool,
                    color: drawColor,
                    size: drawPercent,
                    angle: drawAngle,
                    clicked: false,
                    time: audio.currentTime,
                }
                actions.push(action);
            }
            // ---------------------------------------------------
            
            
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
            
    // Send data to server if it's live session
    if (!inSolo) {
        socket.emit('draw', {
            x: x,
            y: y,
            tool: drawTool,
            color: drawColor,
            size: drawPercent,
            angle: drawAngle,
            clicked: false,
            time: audio.currentTime,
            session: mySessionID,
            conductor: meConductor
        });
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
    }
}


// --------------------------------------------------------------------------------------------------------------------------------------------------------------------
// RECORDS
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------


var recCanvas;
var recCtx;

var recCanvasWidth;
var recCanvasHeight;

var canvasData;
var playedRecord;
var recPlayedID;

var recAudio;
var playing = false;
var record;
var recordsNum = 0;

var recRandAngle;
var recRandNums;

var download = false;
var encoder;
var encoderOutput;
var dlUrl;
var images = [];

var audioData;

var recorder;

//var screenshots = [];

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
    var iMax = record.actions.length;
    console.log(iMax);
    var i = iSaved;

    var step = function() {
        // Get our current progres
        var timestamp = new Date().getTime();
        var currTime = timestamp - start + currTimeSaved;
        
        // Draw all actions until currTime
        
        while (i < iMax && record.actions[i].time <= currTime/1000) {
            recDraw(record.actions[i].x, record.actions[i].y, record.actions[i].tool, record.actions[i].color,
                 record.actions[i].size, record.actions[i].angle, record.actions[i].clicked);
                 
            i++;
        }
        
        if (download) {
            encoder.add(recCtx);
            document.getElementById("dl-modal-status").innerHTML = 'Encoded ' + i + '/' + iMax + ' frames...';
        }
        
        // If the animation hasn't finished, repeat the step.
        if (i < iMax && playing) requestAnimationFrame(step);
        else {
            
            iSaved = i;
            currTimeSaved = currTime;
            
            if (download) {
                
                document.getElementById("dl-modal-status").innerHTML = 'Started to compile recorded frames...';
                
                encoderOutput = encoder.compile();
                
                var binaryData = [];
                binaryData.push(encoderOutput);
                var vBlob = new Blob(binaryData);
                
                var aBlob = dataURItoBlob(audioData);
                
                document.getElementById("dl-modal-status").innerHTML = "Encoding audio and video to mp4, this may take a while...";
                
                convertStreams(vBlob,aBlob);
                
                //document.getElementById("vid").src = URL.createObjectURL(new Blob(binaryData));
                
                /*var aBlob = dataURItoBlob(audioData);
                
                document.getElementById("dl-modal-status").innerHTML = "Finished recording canvas, started encoding...";
                
                recorder.stop(function(blob) {
                    convertStreams(blob,aBlob);
                    //document.getElementById("vid").src = URL.createObjectURL(blob);
                });*/
            }
        }
        
    };
    // Start the animation
    return step();
};

function playRec(key,id) {
    
    if (playing) {
        if (playedRecord != key) {
            playedRecord = key;
            socket.emit('get-record', { id: key });
            iSaved = 0;
            currTimeSaved = 0;
            $('#loading-popup').modal('show');
            document.getElementById('rec' + id).setAttribute("class", "glyphicon glyphicon-pause");
            document.getElementById(recPlayedID).setAttribute("class", "glyphicon glyphicon-play");
            recPlayedID = id;
        }
        else {
            document.getElementById('rec' + id).setAttribute("class", "glyphicon glyphicon-play");
        }
        recAudio.pause();
        playing = false;
    }
    else {
        if (playedRecord != key) {
            recPlayedID = id;
            playedRecord = key;
            socket.emit('get-record', { id: key });
            iSaved = 0;
            currTimeSaved = 0;
            $('#loading-popup').modal('show');
            document.getElementById('rec' + id).setAttribute("class", "glyphicon glyphicon-pause");
        }
        else {
            document.getElementById('rec' + id).setAttribute("class", "glyphicon glyphicon-pause");
            recAudio.play();
            playing = true;
            animate();
        }
    }
}

function recMoveProgress() {
    
    var elem = document.getElementById("rec-progBar");   
    var idx = 0;
    var width = 0;
    var id = setInterval(frame, 250);
    
    function frame() {
        if (recAudio.currentTime == recAudio.duration) {
            clearInterval(id);
        } 
        else {
            width = (recAudio.currentTime / recAudio.duration) * 100;
            elem.style.width = width + '%'; 
        }
    }
}

function muteRecordPressed() {
    if (!recAudio.muted) {
        recAudio.muted = true;
        document.getElementById("rec-mute-icon").setAttribute("class", "glyphicon glyphicon-volume-off");
    }
    else {
        recAudio.muted = false;
        document.getElementById("rec-mute-icon").setAttribute("class", "glyphicon glyphicon-volume-up");
    }
}

function dlRecord(key) {
    download = true;
    $('#download-popup').modal('show');
    socket.emit('get-record', { id: key });
}










//
// Functions for encoding two seperate sources: canvas recording(webm) and audio into mp4 container -------------------------------------------
//

var worker;
var workerPath = 'https://4dbefa02675a4cdb7fc25d009516b060a84a3b4b.googledrive.com/host/0B6GWd_dUUTT8WjhzNlloZmZtdzA/ffmpeg_asm.js';
//var videoFile = !!navigator.mozGetUserMedia ? 'video.gif' : 'video.webm';

function convertStreams(videoBlob, audioBlob) {
    var vab;
    var aab;
    var buffersReady;
    var workerReady;
    var posted = false;

    var fileReader1 = new FileReader();
    fileReader1.onload = function() {
        vab = this.result;

        if (aab) buffersReady = true;

        if (buffersReady && workerReady && !posted) postMessage();
    };
    var fileReader2 = new FileReader();
    fileReader2.onload = function() {
        aab = this.result;

        if (vab) buffersReady = true;

        if (buffersReady && workerReady && !posted) postMessage();
    };

    fileReader1.readAsArrayBuffer(videoBlob);
    fileReader2.readAsArrayBuffer(audioBlob);

    if (!worker) {
        worker = processInWebWorker();
    }

    worker.onmessage = function(event) {
        var message = event.data;
        if (message.type == "ready") {
            log('<a href="'+ workerPath +'" download="ffmpeg-asm.js">ffmpeg-asm.js</a> file has been loaded.');
            workerReady = true;
            if (buffersReady)
                postMessage();
        } else if (message.type == "stdout") {
            log(message.data);
        } else if (message.type == "start") {
            log('<a href="'+ workerPath +'" download="ffmpeg-asm.js">ffmpeg-asm.js</a> file received ffmpeg command.');
        } else if (message.type == "done") {
            log(JSON.stringify(message));

            var result = message.data[0];
            log(JSON.stringify(result));

            var blob = new Blob([result.data], {
                type: 'video/mp4'
            });

            //log(JSON.stringify(blob));

            PostBlob(blob);
        }
    };
    var postMessage = function() {
        posted = true;
        worker.postMessage({
            type: 'command',
            arguments: [
                '-i', 'video.webm', 
                '-i', 'audio.wav', 
                '-c:v', 'mpeg4', 
                '-c:a', 'vorbis', 
                '-b:v', '6400k', 
                '-b:a', '4800k',
                '-strict', 'experimental', 'output.mp4'
            ],
            files: [
                {
                    data: new Uint8Array(vab),
                    name: "video.webm"
                },
                {
                    data: new Uint8Array(aab),
                    name: "audio.wav"
                }
            ]
        });
    }
    
}
function processInWebWorker() {
    var blob = URL.createObjectURL(new Blob(['importScripts("' + workerPath + '");' +
            'var now = Date.now;' +
            'function print(text) {' +
                'postMessage({"type" : "stdout","data" : text});' +
    
            '};' +
            'onmessage = function(event) {' +
                'var message = event.data;' +
                'if (message.type === "command") {' +
                    'var Module = {' +
                        'print: print,' +
                        'printErr: print,' +
                        'files: message.files || [],' +
                        'arguments: message.arguments || [],' +
                        //'TOTAL_MEMORY: message.TOTAL_MEMORY || false' +
                        'TOTAL_MEMORY: 500000000' +
                    '};' +
                    'postMessage({' +
                        '"type" : "start",' +
                        '"data" : Module.arguments.join(" ")});' +
                    'postMessage({"' +
                        'type" : "stdout",' +
                        '"data" : "Received command: " + Module.arguments.join(" ") + ((Module.TOTAL_MEMORY) ? ". Processing with " + Module.TOTAL_MEMORY + " bits." : "")' +
                    '});' +
                    'var time = now();' +
                    'var result = ffmpeg_run(Module);' +
                    'var totalTime = now() - time;' +
                    'postMessage({' +
                        '"type" : "stdout",' +
                        '"data" : "Finished processing (took " + totalTime + "ms)"' +
                    '});' +
                    'postMessage({' +
                        '"type" : "done",' +
                        '"data" : result,' +
                        '"time" : totalTime' +
                    '});' +
                '}};' +
                'postMessage({' +
                    '"type" : "ready"' +
                '});'],
    {
        type: 'application/javascript'
    }));

    var worker = new Worker(blob);
    URL.revokeObjectURL(blob);
    return worker;
}
function PostBlob(blob) {
    document.getElementById("dl-modal-title").innerHTML = "All done, ready for download.";
    document.getElementById("dl-modal-status").innerHTML = "";
    document.getElementById("dl-modal-message").innerHTML = "";
    document.getElementById("dl-dismiss-button").style.display = "inline";
    document.getElementById("dl-ready-div").innerHTML = '<a href="' + URL.createObjectURL(blob) + 
        '" target="_blank" download="' + record.name + '.mp4"><button type="button" class="btn btn-primary">Download</button></a>';
    document.getElementById("dl-ready-div").setAttribute('contenteditable', 'false');
}
function log(message) {
    console.log(message);
}
function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], {type: mimeString});
    return blob;
}












var sprayNum = 0;
function recDraw(xC,yC,tool,color,size,angle,clicked) {
    
    if (tool == "hLine") {
        size = (size/100) * recCanvasWidth;
        recCtx.beginPath();
        recCtx.lineWidth = 2;
        recCtx.moveTo(xC-(size/2),yC);
        recCtx.lineTo(xC+(size/2),yC);
        recCtx.strokeStyle = color;
        recCtx.stroke();
    }
    else if (tool == "rLine") {
        if (clicked) return;
        
        size = ((size/100) * recCanvasHeight) * 2;
        angle = angle + 90;
        var cos = Math.cos(Math.PI * angle / 180.0);
        var sin = Math.sin(Math.PI * angle / 180.0);
        
        recCtx.beginPath();
        recCtx.lineWidth = 1;
        
        recCtx.moveTo(xC - size/2 * cos, yC - size/2 * sin); recCtx.lineTo(xC - (size/2-size/50) * cos, yC - (size/2-size/50) * sin);
        recCtx.moveTo(xC + size/2 * cos, yC + size/2 * sin); recCtx.lineTo(xC + (size/2-size/50) * cos, yC + (size/2-size/50) * sin);
        
        recCtx.moveTo(xC - (size/2-size/20) * cos, yC - (size/2-size/20) * sin); recCtx.lineTo(xC - (size/2-size/15) * cos, yC - (size/2-size/15) * sin);
        recCtx.moveTo(xC + (size/2-size/20) * cos, yC + (size/2-size/20) * sin); recCtx.lineTo(xC + (size/2-size/15) * cos, yC + (size/2-size/15) * sin);
        
        recCtx.moveTo(xC - (size/2-size/10) * cos, yC - (size/2-size/10) * sin); recCtx.lineTo(xC - (size/2-size/6.5) * cos, yC - (size/2-size/6.5) * sin);
        recCtx.moveTo(xC + (size/2-size/10) * cos, yC + (size/2-size/10) * sin); recCtx.lineTo(xC + (size/2-size/6.5) * cos, yC + (size/2-size/6.5) * sin);
        
        recCtx.moveTo(xC - (size/2-size/5.5) * cos, yC - (size/2-size/5.5) * sin); recCtx.lineTo(xC - (size/2-size/3.5) * cos, yC - (size/2-size/3.5) * sin);
        recCtx.moveTo(xC + (size/2-size/5.5) * cos, yC + (size/2-size/5.5) * sin); recCtx.lineTo(xC + (size/2-size/3.5) * cos, yC + (size/2-size/3.5) * sin);
        
        recCtx.moveTo(xC - (size/5.4) * cos, yC - (size/5.4) * sin); recCtx.lineTo(xC + (size/5.4) * cos, yC + (size/5.4) * sin);
        
        recCtx.strokeStyle = color;
        recCtx.stroke();
    }
    else if (tool == "sprayLine") {
        
        var percent = size;
        size = (size/100) * recCanvasWidth;
        
        recCtx.fillStyle = color;
        for (var i = size; i > 0; i--) {
            var x = (randNums[sprayNum] / 1000) * size/2;
            var y = (randNums[sprayNum+1] / 1000) * size/2;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            if (Math.abs(y) < size/6 || percent == 200) recCtx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
         
    }
    else if (tool == "spray") {
        
        size = ((size/100) * recCanvasWidth) / 2;
        
        recCtx.fillStyle = color;
        for (var i = size; i > 0; i--) {
            var angle = randAngle[sprayNum];
            var radius = (randNums[sprayNum] / 1000) * size;
            recCtx.fillRect(xC + radius * Math.cos(angle), yC + radius * Math.sin(angle), 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
    }
    else if (tool == "brushInc" || tool == "brushDec" || tool == "brushIncSprayed" || tool == "brushDecSprayed") {
        
        size = (size/100) * recCanvasWidth;
        
        if (clicked) {
            recCtx.beginPath();
            recCtx.moveTo(xC,yC);
            recCtx.fillStyle = color;
        }
        else {
            recCtx.lineTo(xC,yC);
            recCtx.lineWidth = size;
            recCtx.lineJoin = recCtx.lineCap = 'round';
            recCtx.strokeStyle = color;
            recCtx.stroke();
            
            recCtx.beginPath();
            recCtx.moveTo(xC,yC);
            
            for (var i = size*5; i > 0; i--) {
                var angle = randAngle[sprayNum];
                var radius = (randNums[sprayNum] / 1000) * (size/1.5);
                recCtx.fillRect(xC + radius * Math.cos(angle), yC + radius * Math.sin(angle), 1, 1);
                
                sprayNum = sprayNum + 2;
                if (sprayNum >= 10000) sprayNum = 0;
            }
            
            recCtx.beginPath();
            recCtx.moveTo(xC,yC);
            
            if (tool == "brushIncSprayed" || tool == "brushDecSprayed") {
                 for (var i = size*2; i > 0; i--) {
                    var angle = randAngle[sprayNum];
                    var radius = (randNums[sprayNum] / 1000) * (size*1.2);
                    recCtx.fillRect(xC + radius * Math.cos(angle), yC + radius * Math.sin(angle), 1, 1);
                    
                    sprayNum = sprayNum + 2;
                    if (sprayNum >= 10000) sprayNum = 0;
                }
            }
        }
    }
    else if (tool == "fullRoundSpray") {
        
        size = ((size/100) * recCanvasWidth) / 2;
        
        recCtx.beginPath();
        recCtx.arc(xC,yC,size,0,2*Math.PI);
        
        recCtx.lineWidth = 1;
        recCtx.strokeStyle = color;
        recCtx.fillStyle = color;
        
        recCtx.stroke();
        
        for (var i = size*5; i > 0; i--) {
            var x = (randNums[sprayNum] / 1000) * size;
            var y = (randNums[sprayNum+1] / 1000) * size;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            if (Math.abs(x) + Math.abs(y) < size * 1.4) recCtx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
    }
    else if (tool == "stripedRoundSpray") {
        
        size = ((size/100) * recCanvasWidth) / 2;

        recCtx.lineWidth = 1;
        recCtx.strokeStyle = color;
        recCtx.fillStyle = color;

        for (var i = 3; i <= 32; i = i+4) {
            recCtx.beginPath();
            recCtx.arc(xC,yC,size,(i/16)*Math.PI,((i+2)/16)*Math.PI);
            recCtx.stroke();
        }
        
        for (var i = size*5; i > 0; i--) {
            var x = (randNums[sprayNum] / 1000) * size;
            var y = (randNums[sprayNum+1] / 1000) * size;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            if (Math.abs(x) + Math.abs(y) < size * 1.4) recCtx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
    }
    else if (tool == "blackedSpray") {
        
        size = ((size/100) * recCanvasWidth) / 2;
        
        recCtx.fillStyle = color;
        
        for (var i = size; i > 0; i = i-2) {
            var x = (randNums[sprayNum] / 1000) * size;
            var y = (randNums[sprayNum+1] / 1000) * size;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            if (Math.abs(x) + Math.abs(y) < size * 1.4) recCtx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
        
        recCtx.fillStyle = 'black';
        for (var i = size; i > 0; i = i-2) {
            var angle = randAngle[sprayNum];
            var radius = (randNums[sprayNum] / 1000) * size;
            recCtx.fillRect(xC + radius * Math.cos(angle), yC + radius * Math.sin(angle), 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
    }
    else if (tool == "blackedSpraySquare") {
        
        size = ((size/100) * recCanvasWidth) / 2;
        
        recCtx.fillStyle = color;
        
        for (var i = size; i > 0; i = i-2) {
            var x = (randNums[sprayNum] / 1000) * size;
            var y = (randNums[sprayNum+1] / 1000) * size;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            recCtx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
        
        recCtx.fillStyle = 'black';
        
        for (var i = size; i > 0; i = i-2) {
            var x = (randNums[sprayNum] / 1000) * size;
            var y = (randNums[sprayNum+1] / 1000) * size;
            if (Math.random() >= 0.5) x = x * -1;
            if (Math.random() >= 0.5) y = y * -1;
            
            recCtx.fillRect(xC + x, yC + y, 1, 1);
            
            sprayNum = sprayNum + 2;
            if (sprayNum >= 10000) sprayNum = 0;
        }
    }
    else if (tool == "brush") {
        
        size = (size/100) * recCanvasWidth;
        
        if (clicked) {

            recCtx.beginPath();
            recCtx.arc(xC,yC,size/2,0,2*Math.PI);
            recCtx.fillStyle = color;
            recCtx.fill();
            
            recCtx.beginPath();
            recCtx.lineWidth = size;
            recCtx.lineJoin = recCtx.lineCap = 'round';
            recCtx.strokeStyle = color;
            recCtx.moveTo(xC,yC);
            recCtx.lineTo(xC,yC);
        }
        else {
            recCtx.lineTo(xC,yC);
            recCtx.stroke();
        }
    }
    else if (tool == "transparent") {
        
        recCtx.beginPath();
        recCtx.arc(xC, yC, size, 0, 2*Math.PI, false);
        recCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
        recCtx.fill();
        
    }
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
        socket.emit('change-username', { name : name, session: mySessionID, user: myUserNum });
        return false;
    });
    
    $('#message-input-form').submit(function() {
        var message = document.getElementById("message-input").value;
        document.getElementById("message-input").value = "";
        socket.emit('send-message', { message : message, session: mySessionID, user: myUserNum });
        return false;
    });
    
    socket.on('music-refresh', function (data) {
        
        // Clear music list and music selectors
        document.getElementById('music-list').innerHTML = '';
        document.getElementById('music-picker').innerHTML = '';
        document.getElementById('solo-music-picker').innerHTML = '';

        // Update music list and music selectors
        for(var i = 0; i < data.names.length; i++) {
            var name = data.names[i];
            document.getElementById('music-list').innerHTML = document.getElementById('music-list').innerHTML + 
                '<li class="list-group-item">' + name + '</li>';
            document.getElementById('music-picker').innerHTML = document.getElementById('music-picker').innerHTML + 
                '<li class="list-group-item m-picker" id="music' + i + '" onclick="selectMusic(this.id)">' + name + '</li>';
            document.getElementById('solo-music-picker').innerHTML = document.getElementById('solo-music-picker').innerHTML + 
                '<li class="list-group-item m-picker" id="s-music' + i + '" onclick="soloSelectMusic(this.id)">' + name + '</li>';

        }

        document.getElementById('loading-icon').style.visibility = "hidden";
        upload = false;
    });
    
    socket.on('join-refresh-res', function(data) {
        
        var noRooms = true;
        
        // Clear join panel
        document.getElementById("join-panel-body").innerHTML = "<ul id=\"join-list\" class=\"list-group\"></ul>";

        var check;
        // Go through sessions
        for (var key in data.sessions) {
            check = true;
            
            if (!data.sessions[key].show) {
                continue;
            }
            noRooms = false;
            
            // Go through users in that session and see if this user is in that session
            for (var j = 0; j < data.sessions[key].users.length; j++) {
                if (data.sessions[key].users[j].id == socketID) {
                    
                    myUserNum = j;
                    
                    var name = data.sessions[key].sessionData.name;
                    var li = document.createElement("LI");
                    
                    li.innerHTML = "<b>" + name + "</b> <span style=\"float:right;\"><small>Users in the room: " + data.sessions[key].users.length + "</small>" +
                    "<span style=\"margin-left:48px;\">Joined</span></span>";
                    
                    li.classList.add("list-group-item");
                    document.getElementById("join-list").appendChild(li);
                    check = false;
                    
                    document.getElementById("new-room-input").disabled = true;
                    
                    break;
                }
            }
            if (check) {
                var name = data.sessions[key].sessionData.name;
                var li = document.createElement("LI");
                
                li.innerHTML = "<b>" + name + "</b> <span style=\"float:right;\"><small>Users in the room: " + data.sessions[key].users.length + "</small>" +
                "<button id=\"join-button\" type=\"button\" class=\"btn btn-primary\" style=\"margin-left:50px;\" onclick=\"join(" + key + 
                ")\"><span class=\"glyphicon glyphicon-chevron-right\"></span></button></span>";
                
                li.classList.add("list-group-item");
                document.getElementById("join-list").appendChild(li);
            }
        }
        
        if (noRooms) document.getElementById("join-panel-body").innerHTML = "<p style=\"margin-left:15px;margin-top:15px;\">No rooms available</p>";
        
    });
    
    socket.on('user-data', function (data) {
        socketID = data.user.id;
        mySessionID = data.sessionID;
        document.getElementById("username-input").disabled = false;
        document.getElementById("message-input").disabled = false;
        document.getElementById("chat-panel-body").innerHTML = "";
        
        if (data.user.conductor) {
            document.getElementById("start-session-div").style.visibility = "visible";
            
            meConductor = true;
            
            socket.emit('music-refresh-req');
        }
        
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
    
    socket.on('canvas-init', function (data) {
        
        document.getElementById("main-live-session").style.display = "none";
        document.getElementById("main-live-canvas").style.display = "block";
        
        // Init canvas
        
        canvas = document.getElementById('canv');
        
        randNums = data.randNums;
        randAngle = data.randAngle;
        
        canvas.width = data.session.sessionData.canW;
        canvas.height = data.session.sessionData.canH;
        
        canvasWidth = data.session.sessionData.canW;
        canvasHeight = data.session.sessionData.canH;
        
        canvas.style.width = data.session.sessionData.canW + "px";
        canvas.style.height = data.session.sessionData.canH + "px";
        
        ctx = canvas.getContext("2d");
        
        boudRect = canvas.getBoundingClientRect();
        
        if (data.session.sessionData.bg == 1) {
            ctx.fillStyle = "rgb(0,0,0)";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
        else if (data.session.sessionData.bg == 2) {
            ctx.fillStyle = "rgb(255,255,255)";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
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
        
        // Init color picker
        
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
        
        // Gray shades for brightness column
        
        var brightnessCol = document.getElementById('brightness-column');
        var brElements = brightnessCol.childNodes;
        for (var i = 0; i < 13; i++) {
            brElements[(i*2)+1].style.backgroundColor = "hsl(0,0%," + (i/12)*100 + "%)";
        }
        
        // Start audio
        
        document.getElementById("play-button").disabled = true;
        
        audio = new Audio(data.audio);
        
        // When audio file is loaded
        audio.addEventListener('loadedmetadata', function() {
            socket.emit('play-ready', { session: mySessionID });
        });
        
        audio.onended = function() {
            //if (meConductor) socket.emit('audio-ended', { session: mySessionID });
            window.location.href = "/"; 
        }
        document.getElementById("mute-button").disabled = true;
    });
    
    socket.on('play-ready-response', function (file) {
        $('#loading-popup').modal('hide');
        document.getElementById("mute-button").disabled = false;
        audio.play();
        moveProgress();
    });
    
    socket.on('draw-response', function (data) {
        if (data.session == mySessionID) {
            if (meConductor && !data.conductor) draw(data.x,data.y,data.tool,data.color,data.size,data.angle,data.clicked);
            else if (data.conductor && !meConductor) draw(data.x,data.y,data.tool,data.color,data.size,data.angle,data.clicked);
        }
        
    });
    
    socket.on('records-res', function (data) {
        
        var li = document.createElement("LI");
        li.innerHTML = '<h5 style="float:left;"><b>' + data.name + 
        
            '</b></h5><button type="button" class="btn btn-primary" style="float:right;margin-left:10px;" onclick="playRec(\'' + 
                data.key + '\',' + recordsNum + ')"><span id="rec' + recordsNum + '" class="glyphicon glyphicon-play"></span></button>' +
                
            '</b><button type="button" class="btn btn-primary" style="float:right;" onclick="dlRecord(\'' + 
                data.key + '\')"><span class="glyphicon glyphicon-download-alt"></span></button>';
                
        li.classList.add('list-group-item');
        li.classList.add('rec-items');
        
        document.getElementById("rec-list").appendChild(li);
        
        recordsNum++;
    });
    
    socket.on('get-rec-canvas-ready', function (data) {
        
        randNums = data.randNums;
        randAngle = data.randAngle;
        
        recCanvas.width = data.record.canW;
        recCanvas.height = data.record.canH;
        
        recCanvas.style.width = data.record.canW;
        recCanvas.style.height = data.record.canH;
        
        recCanvasWidth = data.record.canW;
        recCanvasHeight = data.record.canH;
        
        recCtx = recCanvas.getContext("2d");

        if (data.record.bg == 1) {
            recCtx.fillStyle = "rgb(0,0,0)";
            recCtx.fillRect(0, 0, recCanvasWidth, recCanvasHeight);
        }
        else if (data.record.bg == 2) {
            recCtx.fillStyle = "rgb(255,255,255)";
            recCtx.fillRect(0, 0, recCanvasWidth, recCanvasHeight);
        }

        record = data.record;
        audioData = data.record.audio;
        
        if (download) {
            iSaved = 0;
            currTimeSaved = 0;
            
            encoder = new Whammy.Video(15); 
            
            document.getElementById("dl-modal-status").innerHTML = "Started recording canvas";
            
            playing = true;
            animate();
        }
        else {
            recAudio = new Audio(data.record.audio);
            recAudio.addEventListener('loadedmetadata', function() {
                $('#loading-popup').modal('hide');
                document.getElementById("rec-mute-button").disabled = false;
                document.getElementById("mute-icon").setAttribute("class", "glyphicon glyphicon-volume-up");
                playing = true;
                recAudio.play();
                recMoveProgress();
                animate();
            });
        }
    });
    
    socket.on('solo-init-res', function (data) {
        randNums = data.randNums;
        randAngle = data.randAngle;
        
        audio = new Audio(data.audio);
        
        audio.addEventListener('loadedmetadata', function() {
            $('#loading-popup').modal('hide');
            document.getElementById("play-button").disabled = false;
        });
    });
});

$( window ).unload(function() {
    if (mySessionID) {
        socket.emit('leaving', { sessionID: mySessionID });
    }
});
