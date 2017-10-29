var socket = io.connect();

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------
// NEW SESSION
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------

var socketID;
var mySessionID;
var myUserNum;
var meConductor = false;
var inSolo = false;

var noMusic = false;

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
    var audioSrc = document.getElementById('audio-player').src;
    document.getElementById('loading-icon').style.visibility = "visible";
    document.getElementById('upload-button').disabled = true;
    socket.emit('file-upload',{ file:audioSrc, name:name });
}

function songClicked(val) {
    socket.emit('song-data-req',{ val:val });
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
    document.getElementById("start-text-editor-button").disabled = false;
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
    $('#solo-popup').modal('show');
    socket.emit('music-refresh-req');
    document.body.style.overflow = 'hidden';
}
function startSoloSession(check) {
    
    if (!check) {
        $('#loading-popup').modal('show');
        $('#text-popup').modal('hide');
        socket.emit('solo-init',{ audio:soloSelectedMusic });
        
        encoder = new Whammy.Video(10);
    
        var id = setInterval(frame, 100);
        var j = 0;
        function frame() {
            j++;
            encoder.add(textCtx);
            if (j == textDuration * 10) clearInterval(id); 
        }
    }
    else {
        noMusic = true;
        $('#solo-popup').modal('hide');
    }
    
    
    document.getElementById("solo-row").style.display = "inline";
    document.getElementById("main-homepage").style.display = "none";
    document.getElementById("main-live-canvas").style.display = "block";

    // Init canvas
    
    canvas = document.getElementById('canv');
    
    canvas.width = 1280;
    canvas.height = 720;
    
    canvasWidth = 1280;
    canvasHeight = 720;
    
    canvas.style.width = "1280px";
    canvas.style.height = "720px";
    
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
    
    // Init color picker
    
    pickerCanvas = document.getElementById('color-picker-canvas');
    
    pickerCanvas.width = 440;
    pickerCanvas.height = 720;
    
    var context = pickerCanvas.getContext('2d');
    var imageObj = new Image();
    
    imageObj.onload = function() {
        context.drawImage(imageObj, 0, 0);
        context.crossOrigin = "Anonymous";
        imageData = context.getImageData(0,0,440,720);
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
    
    // Init audio stamp canvas
    
    var stampCanvas = document.getElementById('audio-stamp-canvas');
    
    stampCanvas.width = $("#audio-stamp-canvas").width();
    stampCanvas.height = $("#audio-stamp-canvas").height();
    var stampCanvasCtx = stampCanvas.getContext('2d');
    
    stampCanvas.addEventListener("mousedown", function (e) {
        stampAudio(stampCanvasCtx, e);
    }, false);
    
    
    // Gray shades for brightness column
    
    var brightnessCol = document.getElementById('brightness-row');
    var brElements = brightnessCol.childNodes;
    for (var i = 0; i < 13; i++) {
        brElements[(i*2)+1].style.backgroundColor = "hsl(0,0%," + (i/12)*100 + "%)";
    }
    
    inSolo = true;
    redrawAll();
    document.getElementById("footer").style.visibility = "hidden";
}
function stampAudio(context, e) {
    var x = e.clientX + document.body.scrollLeft - 15;
    if (e.which == 3) {
        context.fillStyle = "white";
        context.fillRect(x-4,0,8,20);
    }
    else {
        context.fillRect(x-2,0,4,20);
    }
    context.fillStyle = "black";
}

var SoloMoveI = 0;
function soloMoveProgress() {
    var elem = document.getElementById("progBar");
    var indicator = document.getElementById("time-indicator");
    var idx = 0;
    var width = 0;
    var id = setInterval(frame, 30);
    
    var allMinutes = Math.floor(audio.duration / 60);
    var allSeconds = Math.floor(audio.duration - allMinutes * 60);
    
    var currMinutes;
    var currSeconds;
    
    function frame() {
        if (audio.currentTime == audio.duration || !playing) {
            clearInterval(id);
        } 
        else {
            if (SoloMoveI < layers.length) {
                while(layers[SoloMoveI].time <= audio.currentTime) {
                    draw(layers[SoloMoveI]);
                    SoloMoveI++;
                    if (SoloMoveI == layers.length) {
                        //SoloMoveI = 0;
                        break;
                    }
                }
                //i = 0;
            }
            currMinutes = Math.floor(audio.currentTime / 60);
            currSeconds = Math.floor(audio.currentTime - currMinutes * 60);
            indicator.innerHTML = "<b>" + currMinutes + ":" + ("0" + currSeconds).slice(-2) + " / " + allMinutes + ":" + ("0" + allSeconds).slice(-2) + "</b>";
            
            width = (audio.currentTime / audio.duration) * 100;
            elem.style.width = width + '%'; 
        }
    }
}

function redrawAll(time) {
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    if (layers.length != 0) {
        randN = 0;
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].time < time) {
                draw(layers[i]);
            }
            else {
                SoloMoveI = i;
                break;
            }
        }
    }
    
    if (actions.length != 0) {
        randN = 0;
        for (var i = 0; i < actions.length; i++) {
            if (actions[i].time < time) {
                draw(actions[i]);
            }
            else {
                actions = actions.slice(0, i);
            }
        }
    }
}
function newLayer() {
    if (actions.length == 0) return;
    
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    SoloMoveI = 0;

    if (layers.length == 0) {
        layers = actions;
    }
    else {
        layers = layers.concat(actions);
        layers.sort(function(a, b){return a.time-b.time});
    }
    actions = [];
    
    document.getElementById("progBar").style.width = 0;
    audio.currentTime = 0;
    audio.pause();
    randN = 0;
    playing = false;
    
    var layW = document.getElementById("layers-wrapper");
    layW.innerHTML = layW.innerHTML + "<div>" + (layW.childNodes.length-1) + "</div>";
}

var encoder;
var encoderOutput;
function finishSolo() {
    if (actions.length != 0) {
        layers = layers.concat(actions);
        layers.sort(function(a, b){return a.time-b.time});
    }
    else if (layers.length == 0) return;
    
    $('#download-popup').modal('show');

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    var fullTime = audio.duration;
    var startTime = new Date().getTime();
    
    var l = 0;
    var id = setInterval(recordCan, 100);
    function recordCan() {
        var currentTime = (new Date().getTime() - startTime) / 1000;
        
        if (currentTime >= fullTime) {
            clearInterval(id);
            startFFmpeg();
        }
        while(layers[l].time <= currentTime) {
            draw(layers[l]);
            l++;
            
            if (l == layers.length) {
                clearInterval(id);
                startFFmpeg();
                break;
            }
        }
        
        encoder.add(ctx);
    }
}

function records() {

}

function startFFmpeg() {
    encoderOutput = encoder.compile();
    
    var url = window.URL.createObjectURL(encoderOutput);
    
    var binaryData = [];
    binaryData.push(encoderOutput);
    var vBlob = new Blob(binaryData);
    
    var aBlob = dataURItoBlob(rawAudio);
    
    convertStreams(vBlob,aBlob);
}

function join(val) {
    document.getElementById("join-error").style.visibility = "hidden";
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

var drawColor = "white";
var drawSize = 1;
var drawTool = "brush";
var drawAngle = 0;

var playing = false;

var rawAudio, audio;
var randAngle;
var randNums;

var x;
var y;
var stepsCounter = 0;

// rLine
var rLineStart = false;
var stepsX = new Array(5);
var stepsY = new Array(5);
var deltaX;
var deltaY;

var actions = [];
var layers = [];
var savedCurrTime;

var drawing = false;

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
    
    var index = (440 * 4 * yCoord) + (xCoord * 4);
    
    var r = imageData.data[index-4];
    var g = imageData.data[index-3];
    var b = imageData.data[index-2];
    document.getElementById('layers-wrapper').style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
    drawColor = rgbToHex(r,g,b);
    
    // Converts RGB to HSL and uses H and S for base values, while changing L, then presenting these colors in left panel where user can change brightness.
    
    var hslVal = rgbToHsl(r,g,b);
    
    var brightnessCol = document.getElementById('brightness-row');
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

function thick1()  { drawSize = 3; saveddrawSize = 3; selectedThick(1); }
function thick2()  { drawSize = 6; saveddrawSize = 6; selectedThick(2); }
function thick3()  { drawSize = 10; saveddrawSize = 10; selectedThick(3); }
function thick4()  { drawSize = 15; saveddrawSize = 15; selectedThick(4); }
function thick5()  { drawSize = 20; saveddrawSize = 20; selectedThick(5); }
function thick6()  { drawSize = 25; saveddrawSize = 25; selectedThick(6); }
function thick7()  { drawSize = 30; saveddrawSize = 30; selectedThick(7); }
function thick8()  { drawSize = 40; saveddrawSize = 40; selectedThick(8); }
function thick9() { drawSize = 60; saveddrawSize = 60; selectedThick(9); }
function thick10() { drawSize = 90; saveddrawSize = 90; selectedThick(10); }
function thick11() { drawSize = 130; saveddrawSize = 130; selectedThick(11); }
function thick12() { drawSize = 170; saveddrawSize = 170; selectedThick(12); }
function thick13() { drawSize = 220; saveddrawSize = 220; selectedThick(13); }
function thick14() { drawSize = 270; saveddrawSize = 270; selectedThick(14); }
function thick15() { drawSize = 350; saveddrawSize = 350; selectedThick(15); }
function thick16() { drawSize = 450; saveddrawSize = 450; selectedThick(16); }
function thick17() { drawSize = 550; saveddrawSize = 550; selectedThick(17); }
function thick18() { drawSize = 650; saveddrawSize = 650; selectedThick(18); }
function thick19() { drawSize = 720; saveddrawSize = 720; selectedThick(19); }
function thick20() { drawSize = 3000; saveddrawSize = 3000; selectedThick(20); }

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
    document.getElementById('layers-wrapper').style.backgroundColor = selB.style.backgroundColor;
    drawColor = selB.style.backgroundColor;
}

function tool1() { drawTool = "brush"; selectedTool(1); }
function tool2() { drawTool = "rLine"; selectedTool(2); }
function tool3() { drawTool = "spray"; selectedTool(3); }
function tool4() { drawTool = "centeredSpray"; selectedTool(4); }
function tool5() { drawTool = "softCircle"; selectedTool(5); }
function tool6() { drawTool = "hardCircle"; selectedTool(6); }

function selectedTool(val) {
    var selT = "tool" + selTool;
    document.getElementById(selT).style.border = "2px solid #DDDDDD";
    //document.getElementById(selT).style.color = "black";
    
    selT = "tool" + val;
    document.getElementById(selT).style.border = "2px solid #000000";
    //document.getElementById(selT).style.color = "white";
    selTool = val;
}

var randN = 0;
function draw(action) {
    
    //console.log(xC,yC,tool,color,size,angle,clicked);
    
    if (action.tool == "brush") {
        ctx.beginPath();
        ctx.fillStyle = action.color;
        ctx.arc(action.x,action.y,action.size/2,0,2*Math.PI);
        ctx.fill();
        ctx.closePath();
    }
    
    else if (action.tool == "rLine") {
        if (action.clicked) return;
        
        var tSize = (action.size*2) - (randNums[randN]*action.size);
        
        var lw = 1 + (tSize/500);
        
        var thr = 0.2 // Threshold for probability of drawn pixel in a line
        
        //size = ((size/100) * canvasHeight) * 2;
        var tAngle = action.angle + 90;
        var cos = Math.cos(Math.PI * tAngle / 180.0);
        var sin = Math.sin(Math.PI * tAngle / 180.0);
        
        ctx.fillStyle = action.color;
        
        for (var i = 0; i < Math.round(tSize/2); i++) {
            
            ctx.globalAlpha = i/(tSize/2);
            
            if (tAngle == 90 || tAngle == 270) {                                              // Vertical
                if (randNums[randN+1] < thr) ctx.fillRect(action.x  - (tSize/2 + i ) * cos, action.y - (tSize/2 - i) * sin, lw, lw);
                if (randNums[randN+2] < thr) ctx.fillRect(action.x  + (tSize/2 + i ) * cos, action.y + (tSize/2 - i) * sin, lw, lw);
            }
            else if (tAngle == 0 || tAngle == 360) {                                          // Horizontal
                if (randNums[randN+1] < thr) ctx.fillRect(action.x  - (tSize/2 - i ) * cos, action.y - (tSize/2 + i) * sin, lw, lw);
                if (randNums[randN+2] < thr) ctx.fillRect(action.x  + (tSize/2 - i ) * cos, action.y + (tSize/2 + i) * sin, lw, lw);
            }
            else {                                                                          // Tilted
                if (randNums[randN+1] < thr) ctx.fillRect(action.x  - (tSize/2 - i ) * cos, action.y - (tSize/2 - i) * sin, lw, lw);
                if (randNums[randN+2] < thr) ctx.fillRect(action.x  + (tSize/2 - i ) * cos, action.y + (tSize/2 - i) * sin, lw, lw);
            }
            ctx.globalAlpha = 1;
            randN += 3;
            if (randN >= 100000) randN = 0;
        }
        
    }
    else if (action.tool == "spray") {
        
        var tSize = action.size/2;
        ctx.fillStyle = action.color;
        
        for (var i = (tSize*tSize) / 100; i > 0; i--) {
            
            var x = randNums[randN] * tSize;
            var y = randNums[randN+1] * tSize;
            
            if (randNums[randN+2] > 0.5) x = x*-1;
            if (randNums[randN+3] > 0.5) y = y*-1;
            
            x = action.x + x;
            y = action.y + y;
            
            var d = Math.sqrt(Math.pow(x - action.x,2) + Math.pow(y - action.y,2));
            
            if (d < tSize) ctx.fillRect(x, y, 1.5, 1.5);
            
            randN += 4;
            if (randN >= 100000) randN = 0;
        }
    }
    else if (action.tool == "centeredSpray") {
        
        var tSize = action.size/2;
        ctx.fillStyle = action.color;
        
        for (var i = (tSize*tSize) / 100; i > 0; i--) {
            
            var angle = randNums[randN] * Math.PI*2;
            var radius = randNums[randN+1] * tSize;
            //ctx.globalAlpha = 1 - Math.random();
            
            ctx.fillRect(action.x + radius * Math.cos(angle), action.y + radius * Math.sin(angle), 1.5, 1.5);
            
            randN += 2;
            if (randN >= 100000) randN = 0;
        }
    }
    else if (action.tool == "softCircle") {
        
        ctx.fillStyle = action.color;
        var tSize = action.size/2;
        
        for (var radius = tSize; radius >= 0; radius -= 2) {
            ctx.globalAlpha = 1 - (radius / tSize);
            for (var i = 0; i < Math.PI*2; i += Math.PI/(radius*1.5)) {
                ctx.fillRect(action.x + (radius * Math.cos(i)), action.y + (radius * Math.sin(i)), 2, 2);
            }
        }
    }
    
    else if (action.tool == "hardCircle") {
        
        ctx.fillStyle = action.color;
        var tSize = action.size/2;
        
        
        /*for (var radius = tSize; radius > 0; radius -= 4) {
            ctx.globalAlpha = 1 - (radius / tSize);
            for (var i = 0; i < Math.PI*2; i += Math.PI/(radius*1.5)) {
                ctx.fillRect(action.x + (radius * Math.cos(i)), action.y + (radius * Math.sin(i)), 4, 4);
            }
        }*/
        console.log(tSize);
        for (var i = -tSize; i < tSize; i += 3) {
            for (var j = -tSize; j < tSize; j++) {
                ctx.globalAlpha = 1 - (Math.abs(i)/(tSize));
                var d = Math.sqrt(Math.pow((action.x + j) - action.x,2) + Math.pow((action.y + i) - action.y,2));
            
                if (d < tSize) ctx.fillRect(action.x + j, action.y + i, 1, 1);
                //ctx.fillRect(action.x + j, action.y + i, 1, 1);
            }
        }
        for (var j = -tSize; j < tSize; j += 3) {
            for (var i = -tSize; i < tSize; i++) {
                ctx.globalAlpha = 1 - (Math.abs(j)/(tSize));
                var d = Math.sqrt(Math.pow((action.x + j) - action.x,2) + Math.pow((action.y + i) - action.y,2));
            
                if (d < tSize) ctx.fillRect(action.x + j, action.y + i, 1, 1);
                //ctx.fillRect(action.x + j, action.y + i, 1, 1);
            }
        }
        
        
    }
    /*else if (tool == "blackedSpray") {
        
        size = size / 2;
        
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
    
    else if (tool == "brushInc" || tool == "brushDec" || tool == "brushIncSprayed" || tool == "brushDecSprayed") {
        
        //size = (size/100) * canvasWidth;
        
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
    else if (tool == "transparent") {
        
        ctx.beginPath();
        ctx.arc(xC, yC, size, 0, 2*Math.PI, false);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fill();
        
    }*/
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
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
  }
  return array;
}

function findxy(res, e) {

    if (res == 'down' && inSolo) {
        
        // if right mouse button pressed
        if (event.which == 3) {
            if (playing) {
                audio.pause();
                playing = false;
                document.getElementById("finish-solo-button").disabled = false;
                document.getElementById("new-layer-button").disabled = false;
            }
            else {
                audio.play();
                playing = true;
                document.getElementById("finish-solo-button").disabled = true;
                document.getElementById("new-layer-button").disabled = true;
                soloMoveProgress();
            }
            return;
        }
        
        stepsCounter = -1;
        drawing = true;
        
        x = e.clientX + document.body.scrollLeft - boudRect.left;
        y = e.clientY + document.body.scrollTop - boudRect.top;
        
        // Save action for backtrack
        if (noMusic) {
            var action = {
                x: x,
                y: y,
                tool: drawTool,
                color: drawColor,
                size: drawSize,
                angle: drawAngle,
                clicked: false
            }
        }
        else {
            var action = {
                x: x,
                y: y,
                tool: drawTool,
                color: drawColor,
                size: drawSize,
                angle: drawAngle,
                clicked: false,
                time: audio.currentTime
            }
        }
        actions.push(action);
        
        // Draw with selected tool
        
        draw(action);
            
    }
    
    if (res == 'move' && inSolo) {
        
        if (drawing) {
            
            // Update coordinates
            x = e.clientX + document.body.scrollLeft - boudRect.left;
            y = e.clientY + document.body.scrollTop - boudRect.top;
            
            if (drawTool == "rLine") {
                
                stepsCounter++;
                
                if (drawTool == "softCircle") {
                    if (stepsCounter == 10) {
                        stepsCounter = 0;
                    }
                    else return;
                }
                else if (drawTool == "rLine") {
                
                    if (rLineStart) {
                        if (stepsCounter == 4) {
                            deltaX = x - stepsX[0];
                            deltaY = y - stepsY[0];
                            drawAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
                            stepsX[4] = x;
                            stepsY[4] = y;
                            stepsCounter = -1;
                        }
                        else {
                            deltaX = x - stepsX[stepsCounter+1];
                            deltaY = y - stepsY[stepsCounter+1];
                            drawAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
                            stepsX[stepsCounter] = x;
                            stepsY[stepsCounter] = y;
                        }
                    }
                    else if (stepsCounter == 4) {
                        stepsX[stepsCounter] = x;
                        stepsY[stepsCounter] = y;
                        stepsCounter = -1;
                        rLineStart = true;
                        return;
                    }
                    else {
                        stepsX[stepsCounter] = x;
                        stepsY[stepsCounter] = y;
                        return;
                    }
                }
            }
            
            if (noMusic) {
                var action = {
                    x: x,
                    y: y,
                    tool: drawTool,
                    color: drawColor,
                    size: drawSize,
                    angle: drawAngle,
                    clicked: false
                }
            }
            else {
                var action = {
                    x: x,
                    y: y,
                    tool: drawTool,
                    color: drawColor,
                    size: drawSize,
                    angle: drawAngle,
                    clicked: false,
                    time: audio.currentTime
                }
            }
            
            
            actions.push(action);
            
            // Draw with selected tool
            
            draw(action);
        }
    }
    
    if (res == 'up' || res == "out") {
        drawing = false;
        rLineStart = false;
        ctx.globalAlpha = 1;
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
function setVolume(val) {
    audio.volume = val/100;
}

$('#canv').bind('contextmenu', function(e) {
    return false;
});

$('#progBar-div').mousedown(function(event) {
    
    if (event.which != 1 || playing) {
        return;
    }
    
    var elem = document.getElementById("progBar");
    var barWidth = ($('#progBar').width() / $('#progBar-div').width()) * 100;
    
    var offset = event.pageX - $('#progBar-div').offset().left;
    
    var percent = (offset / $('#progBar-div').width()) * 100;
    
    if (percent < barWidth) {
        elem.style.width = percent + '%';
        var clickedTime = audio.duration * (percent/100);
        redrawAll(clickedTime);
        audio.currentTime = clickedTime;
    }
});

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------
// TEXT EDITOR
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------

var textBoudRect;
var textCtx;
var letters = "abcdefghijklmnopqrstuvwxyz";
var capitalLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var numbers = "0123456789";
var signs = "=!\"#$%&/()";
var word = "|";
var words = [];
var writing, moving, txtDrawing, txtHolding, txtBorder = false;
var textX, textY = 0;
var xOffset, yOffset;
var bgColor = "#000000";
var textColor = "#FFFFFF";
var capital = false;
var textDuration = 5;

function startTextEditor() {
    
    $('#solo-popup').modal('hide');
    
    var textCan = document.getElementById('text-canvas');
    textCan.width = 1280;
    textCan.height = 720;
    
    textCtx = textCan.getContext("2d");
    textCtx.fillStyle = bgColor;
    textCtx.fillRect(0, 0, 1280, 720);
    
    //textCtx.fillStyle = "#1E20B0";
    //textCtx.font = "60px Calibri";
    //textCtx.fillText("Khatschaturian", 640, 360);
    
    
    
    textCan.addEventListener("mousemove", function (e) {
        textAction('move', e);
    }, false);
    textCan.addEventListener("mousedown", function (e) {
        textAction('down', e);
    }, false);
    textCan.addEventListener("mouseup", function (e) {
        textAction('up', e);
    }, false);
    textCan.addEventListener("mouseout", function (e) {
        textAction('out', e);
    }, false);
    textCan.addEventListener("keyup", function (e) {
        textAction('keyup', e);
    }, false);
    textCan.addEventListener("keydown", function (e) {
        textAction('keydown', e);
    }, false);
    
    
    $('#text-popup').modal('show');
}

function textAction(action,event) {
    
    if (action == "down") {
        
        if (writing) return;
        
        txtHolding = true;
        
        textX = event.clientX - ((window.innerWidth - parseInt(document.getElementById('text-popup').style.width)) / 2) - parseInt($('#text-popup-body').css('padding-left'));
        textY = event.clientY - document.getElementById('text-popup-header').offsetHeight - parseInt($('#text-popup-body').css('padding-top'));
        
        if (moving) {
            if ($("#textSelectDropdown option").size() == 0) return;
            
            movingWords($("#textSelectDropdown").val()-1,textX,textY);
        }
        else {
            
            textCtx.fillStyle = textColor;
            var size = $("#textSizeDropdown option:selected").text();
            
            if ($("#textFontDropdown").val() == 8) {
                txtDrawing = true;
                
                textCtx.beginPath();
                textCtx.arc(textX,textY,size/4,0,2*Math.PI);
                textCtx.fill();
                
                textCtx.beginPath();
                textCtx.lineWidth = size/2;
                textCtx.lineJoin = textCtx.lineCap = 'round';
                textCtx.strokeStyle = textColor;
                textCtx.moveTo(textX,textY);
                textCtx.lineTo(textX,textY);
            }
                
            else {
                writing = true;
                textCtx.font = $("#textSizeDropdown option:selected").text() + "px " + $("#textFontDropdown option:selected").text();
                textCtx.fillText(word, textX, textY);
                document.getElementById("start-solo-session-button").disabled = true;
                disableTextMenu();
            }
        }
    }
    else if (action == "move") {
        if (txtDrawing) {
            textX = event.clientX - ((window.innerWidth - parseInt(document.getElementById('text-popup').style.width)) / 2) - parseInt($('#text-popup-body').css('padding-left'));
            textY = event.clientY - document.getElementById('text-popup-header').offsetHeight - parseInt($('#text-popup-body').css('padding-top'));
            textCtx.lineTo(textX,textY);
            textCtx.stroke();
        }
        if (!moving || !txtHolding || txtDrawing || $("#textSelectDropdown option").size() == 0) return;
        textX = event.clientX - ((window.innerWidth - parseInt(document.getElementById('text-popup').style.width)) / 2) - parseInt($('#text-popup-body').css('padding-left'));
        textY = event.clientY - document.getElementById('text-popup-header').offsetHeight - parseInt($('#text-popup-body').css('padding-top'));
        movingWords($("#textSelectDropdown").val()-1,textX,textY);
    }
    else if (action == "up") {
        txtHolding = false;
        txtDrawing = false;
    }
    else if (action == "keyup") {
        if (!writing) return;
        
        var key = event.keyCode;

        if (key > 64 && key < 91) {         // Letter
            if (capital) drawWord(capitalLetters.substring(key-64, key-65));
            else drawWord(letters.substring(key-64, key-65));
        }
        else if (key > 47 && key < 58) {    // Number
            drawWord(numbers.substring(key-47, key-48));
        }
        else if (key == 32) {               // Space
            drawWord(" ");
        }
        else if (key == 8) {                // Backspace
            word = word.substring(0, word.length - 1);
            drawWord("");
        }
        else if (key == 16) {               // Shift
            capital = false;
        }
        else if (key == 13) {               // Enter
        
            if (word != "|") {
                word = word.substring(0, word.length - 1);
            
                redrawWords();
            
                $("#textSelectDropdown").append('<option value="' + ($("#textSelectDropdown option").size() + 1) + '">' + word + '</option>');
                $("#textSelectDropdown").val($("#textSelectDropdown option").size());
                //$("#textSelectDropdown").selectpicker("refresh");
                
                document.getElementById("start-solo-session-button").disabled = false;
                
                words.push({x:textX, y:textY, font:textCtx.font, color:textColor, text:word});
                word = "|";
            }
            else {
                redrawWords();
            }
            document.getElementById("text-add-button").disabled = false;
            document.getElementById("text-add-button").style.border = "2px solid #00AA00";
            writing = false;
            moving = true;
        }
    }
    else if (action == "keydown") {
        if (capital) return;
        
        var key = event.keyCode;
        if (key == 16) {
            capital = true;
        }
    }
}

function movingWords(idx,x,y) {
    var txt = words[idx].text;
    var txtWidth = textCtx.measureText(txt).width;
    var txtHeight =  parseInt(textCtx.font);
    words[idx].x = x - (txtWidth/2);
    words[idx].y = y + (txtHeight/2) -3;
    
    redrawWords();
}

function redrawWords() {
    
    var savedtxt = textCtx.font;
    var savedfill = textCtx.fillStyle;
    
    textCtx.fillStyle = bgColor;
    textCtx.fillRect(0, 0, 1280, 720);
    
    drawBorders();
    
    for (var i = 0; i < words.length; i++) {
        textCtx.fillStyle = words[i].color;
        textCtx.font = words[i].font;
        textCtx.fillText(words[i].text, words[i].x, words[i].y);
    }
    
    textCtx.font = savedtxt;
    textCtx.fillStyle = savedfill;
    
    if (word != "|") {
        textCtx.fillStyle = textColor;
        textCtx.fillText(word, textX, textY);
    }
}

function drawWord(letter) {
    word = word.substring(0, word.length - 1);
    word = word + letter + "|";
    
    redrawWords();
}

function drawBorders() {
    if (txtBorder) {
        var svd = textCtx.fillStyle;
        
        textCtx.fillStyle = "#888888";
        textCtx.fillRect(426,0,2,720);
        textCtx.fillRect(852,0,2,720);
        textCtx.fillRect(0,239,1280,2);
        textCtx.fillRect(0,479,1280,2);
        //textCtx.fill();
        
        textCtx.fillStyle = svd;
    }
}

function textAdd() {
    moving = false;
    enableTextMenu();
    document.getElementById("text-add-button").disabled = true;
    document.getElementById("text-add-button").style.border = "2px solid #FF0000";
}

function textRemove() {
    if (words.length == 0) return;
    //var idx = $("#textSelectDropdown").val()-1;
   
    
    var select = document.getElementById("textSelectDropdown");
    
    words.splice(select.selectedIndex, 1);
    select.remove(select.selectedIndex);
    
    for (var i = 0; i < $("#textSelectDropdown option").size(); i++) {
        var opt = document.getElementById('textSelectDropdown').options[i];
        opt.value = (i+1)+"";
    }
    
    redrawWords();
}

function enableTextMenu() {
    $("#textColorButton").spectrum("enable");
    
    document.getElementById("textFontDropdown").disabled = false;
    document.getElementById("textSizeDropdown").disabled = false;
    document.getElementById("textChangeDiv").style.border = "2px solid #00AA00";
}

function disableTextMenu() {
    $("#textColorButton").spectrum("disable");
    
    document.getElementById("textFontDropdown").disabled = true;
    document.getElementById("textSizeDropdown").disabled = true;
    document.getElementById("textChangeDiv").style.border = "2px solid #FF0000";
}












//
// Functions for encoding two seperate sources: canvas recording(webm) and audio into mp4 container -------------------------------------------
//

var worker;
var workerPath = 'https://archive.org/download/ffmpeg_asm/ffmpeg_asm.js';
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
                '-itsoffset', textDuration,
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
        '" target="_blank" download="' + "video" + '.mp4"><button type="button" class="btn btn-primary">Download</button></a>';
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













































// --------------------------------------------------------------------------------------------------------------------------------------------------------------------
// RECORDS
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------

/*
var recCanvas;
var recCtx;

var recCanvasWidth;
var recCanvasHeight;

var canvasData;
var playedRecord;
var recPlayedID;

var recAudio;

var record;
var recordsNum = 0;

var recRandAngle;
var recRandNums;

var download = false;

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
                });
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
}*/


















$(document).ready(function() {
    $('#new-room-form').submit(function() {
        var name = document.getElementById("new-room-input").value;
        document.getElementById("new-room-input").value = "";
        
        if (name.length > 10) {
            document.getElementById("join-error").style.visibility = "visible";
            return false;
        }
        
        document.getElementById("join-error").style.visibility = "hidden";
        
        socket.emit('new-session', { name : name });
        return false;
    });
    
    $('#username-input-form').submit(function() {
        var name = document.getElementById("username-input").value;
        document.getElementById("username-input").value = "";
        
        if (name.length > 10) {
            document.getElementById("username-error").style.visibility = "visible";
            return false;
        }
        
        document.getElementById("username-error").style.visibility = "hidden";
        
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
                '<li class="list-group-item" value="' + i + '" onclick="songClicked(this.value)">' + name + '</li>';
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
        
        pickerCanvas.width = 440;
        pickerCanvas.height = 720;
        
        var context = pickerCanvas.getContext('2d');
        var imageObj = new Image();
        
        imageObj.onload = function() {
            context.drawImage(imageObj, 0, 0);
            context.crossOrigin = "Anonymous";
            imageData = context.getImageData(0,0,440,720);
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
        
        var brightnessCol = document.getElementById('brightness-row');
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
            
            //encoder = new Whammy.Video(10);
            
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
        //randAngle = data.randAngle;
        
        rawAudio = data.audio;
        console.log(rawAudio);
        audio = new Audio(data.audio);
        
        audio.addEventListener('loadedmetadata', function() {
            $('#loading-popup').modal('hide');
            var allMinutes = Math.floor(audio.duration / 60);
            var allSeconds = Math.floor(audio.duration - allMinutes * 60);
            document.getElementById("time-indicator").innerHTML = "<b>0:00 / " + allMinutes + ":" + ("0" + allSeconds).slice(-2) + "</b>";
            audio.volume = 0.5;
            //document.getElementById("play-button").disabled = false;
        });
    });
    
    /*socket.on('song-data-res', function (data) {
       
       var player = document.getElementById('audio-player');
       player.src = data.audio;
        
    });*/
    
    
    $("#bgColorButton").spectrum({
        color: bgColor,
        showButtons: false
    });
    $("#bgColorButton").on('move.spectrum', function(e, color) {
        //textCtx.fillStyle = color.toHexString();
        //textCtx.fillRect(0,0,1280,720);
        bgColor = color.toHexString();
        redrawWords();
        if (word != "|") textCtx.fillText(word, textX, textY);
    });
    $("#textColorButton").spectrum({
        color: textColor,
        showButtons: false
    });
    $("#textColorButton").on('move.spectrum', function(e, color) {
        textCtx.fillStyle = color.toHexString();
        textColor = color.toHexString();
    });
    $('#text-borders').change(function() {
        if($(this).is(":checked")) {
            txtBorder = true;
            redrawWords();
        }
        else {
            txtBorder = false;
            redrawWords();
        }
        
    });
    
    $('body').bind('contextmenu', function(e){
        return false;
    }); 
    $('#audio-stamp-canvas').bind('contextmenu', function(e){
        return false;
    }); 
});

/*$( window ).unload(function() {
    if (mySessionID) {
        socket.emit('leaving', { sessionID: mySessionID });
    }
});*/
