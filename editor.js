var mousePos = [-1, -1], oMousePos = [-1, -1];

var windows = new Array(); wzi = new Array(); imgs = new Array();
var mdti = -1; //mouse down titlebar index
var mdwi = -1;
var wrid = -1; //Window resize ID
var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

var area;
var selectedEffect = null;
var reorderEffect = null, tmpEffect = null, dummyEffect = null, blockEffectMove = false, currentEffectOrder = [];

/*
	Look at using flexbox for layout
*/

//Enumerate some stuff
var label = "label";
var control = "control";
var control_null = 0x0;
var control_code = 0x1;
var control_text = 0x2;
var control_number = 0x3;
var control_radio = 0x4;
var control_check = 0x5;
var control_colour = 0x6;
var control_colour_bar = 0x7;
var control_button = 0x8;
var control_dropdown = 0x9;
var control_slider = 0xA;
var control_label = 0xB;

var effectInfo = {
	"unknown": {
		"name": "Unknown",
		"type": null
	},
	"SuperScope": {
		"name": "SuperScope",
		"type": "Render",
		"pane": {
			"code": {
				"init": { label: "Init", control: control_code },
				"perFrame": { label: "Per Frame", control: control_code },
				"onBeat": { label: "On Beat", control: control_code },
				"perPoint": { label: "Per Point", control: control_code }
			},
			"source": { control: control_radio, "options": ["Waveform", "Spectrum"], "default": 0 },
			"channel": { label: "Channel", control: control_radio, "options": ["Left", "Centre", "Right"], "default": 1 },
			"style": { label: "Draw as:", control: control_radio, "options": ["Dots", "Lines"], "default": 1},
			"colour": {
				"count": { label: "Cycle through", control: control_number },
				"list": { label: "Colours (Max 16)", control: control_colour_bar}
			}
		}
	}
};

var preset = {
    "name" : "Science of Superscope",
    "author" : "Marco",
    "clearFrame": false,
    "components": [
        {
            "type": "EffectList",
            "output": "ADDITIVE",
            "components": [
                {
                    "type": "FadeOut",
                    "speed": 0.4
                },
                {
                    "type": "SuperScope",
                    "code": {
                        "init": "n=800",
                        "onBeat": "t=t+0.3;n=100+rand(900);",
                        "perFrame": "t=t-v*0.5",
                        "perPoint": "d=D/n;r=(i-(t*3)); x=(atan(r+d-t)*cos(r+d-t+i)); y=((i+cos(d+v*1.2))-1.5)*1.7;z=-(cos(t+i)+log(v)*cos(r*3))*3;red=cos(r)+1;blue=sin(r);green=sin(i)/2"
                    },
			  "style": 0,
                },
		            {
            "type": "EffectList",
            "output": "ADDITIVE",
            "components": [
                {
                    "type": "FadeOut",
                    "speed": 0.4
                },
                {
                    "type": "SuperScope",
                    "code": {
                        "init": "n=800",
                        "onBeat": "t=t+0.3;n=100+rand(900);",
                        "perFrame": "t=t-v*0.5",
                        "perPoint": "d=D/n;r=(i-(t*3)); x=(atan(r+d-t)*cos(r+d-t+i)); y=((i+cos(d+v*1.2))-1.5)*1.7;z=-(cos(t+i)+log(v)*cos(r*3))*3;red=cos(r)+1;blue=sin(r);green=sin(i)/2"
                    }
                },
                {
                    "type": "DynamicMovement",
                    "enabled": true,
                    "code": "rollingGridley",
                    "coord": "RECT"
                },
                {
                    "type": "ChannelShift",
                    "enabled": false,
                    "onBeatRandom": true
                }
            ]
        },
                {
                    "type": "DynamicMovement",
                    "enabled": true,
                    "code": "rollingGridley",
                    "coord": "RECT"
                },
                {
                    "type": "ChannelShift",
                    "enabled": false,
                    "onBeatRandom": true
                }
            ]
        },
        {
            "type": "Convolution",
            "kernel": "blur"
        },
        {
            "type": "Convolution",
            "kernel": "blur"
        },
        {
            "type": "OnBeatClear"
        }
    ]
};


//From http://www.somacon.com/p355.php
//Assuming this function is in the 'public domain'.
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, "");
}

function eventHook(ele, event, func, remove) {
	if (remove) {
		if (document.all) {
			ele.detachEvent("on" + event, func);
		} else {
			ele.removeEventListener(event, func, false);
		}
	} else {
		if (document.all) {
			ele.attachEvent("on" + event, func);
		} else {
			ele.addEventListener(event, func, false);
		}
	}
}

function fadeOut(ele, st) {
	//Could probably use a css animation here, and listen for it to finish?
	var nt = new Date().getTime();
	if (!st) { st = nt; }
	td = nt - st;
	if (100 <= td) {
		document.getElementById(ele).parentNode.removeChild(document.getElementById(ele));
	} else { 
		opacity = 1 - (td / 100);
		if (!document.all) {
			document.getElementById(ele).style.opacity = opacity;
		} else {
			document.getElementById(ele).style.filter = 'alpha(opacity = '  + (opacity * 100) + ')';
		}
		setTimeout("fadeOut('" + ele + "'," + st + ")", 25);
	}
}

function keypress(event) {
	try {
		var key = window.event.keyCode;
		var shift = window.event.shiftKey;
	} catch(ex){
		var key = event.which;
		var shift = event.shiftKey;
	}
	if ((key == 91 || key == 92) && !shift) {
		if (document.all) {
			window.event.returnValue = null;
		} else {
			event.preventDefault();
		}
		
	}
}

function mousemove(e) {
	oMousePos = [mousePos[0], mousePos[1]];
	mousePos[0] = e.pageX ? e.pageX : e.clientX + (document.body.scrollLeft || document.documentElement.scrollLeft);
	mousePos[1] = e.pageY ? e.pageY : e.clientY + (document.body.scrollTop || document.documentElement.scrollTop);
	if (mdti != -1 && windows[mdti].fixed != true) {
		//Not that the code would go here but still, if they resize the viewport check for windows being off screen!
		cWin = document.getElementById('w' + mdti);
		if (mdwi == -1) { mdwi = mdti; cWin.style.opacity = .625; }
		windows[mdti].pos.x += mousePos[0] - oMousePos[0];
		windows[mdti].pos.y += mousePos[1] - oMousePos[1];
		if (windows[mdti].pos.x > window.innerWidth - 25) { windows[mdti].pos.x = window.innerWidth - 25; }
		if (windows[mdti].pos.x + cWin.offsetWidth < 25) { windows[mdti].pos.x = -cWin.offsetWidth + 25; }
		if (windows[mdti].pos.y > window.innerHeight - 30) { windows[mdti].pos.y = window.innerHeight - 30; }
		if (windows[mdti].pos.y < -10) { windows[mdti].pos.y = -10; }
		cWin.style.left = windows[mdti].pos.x + "px";
		cWin.style.top = windows[mdti].pos.y + "px";
	}
	if (wrid != -1) {
		if (windows[wrid].resize.state == 0) { return; }
		var thisWindow = document.getElementById('w' + wrid);
		//This code is lame.
		thisWindow.style.width = thisWindow.offsetWidth + (mousePos[0] - windows[wrid].resize.x) + "px";
		thisWindow.style.height = thisWindow.offsetHeight + (mousePos[1] - windows[wrid].resize.y) + "px";
		windows[wrid].resize.x = mousePos[0];
		windows[wrid].resize.y = mousePos[1];
	}

	/* Effect ordering */
	/*if (reorderEffect != null) {
		var stageListY = 0;
		var tempEl = document.getElementById('editorTree');
		while (tempEl.getAttribute('class') != 'window') {
			stageListY += tempEl.offsetTop;
			tempEl = tempEl.offsetParent;
		}
		var newY = mousePos[1] - stageListY - (document.getElementById('editorTree').childNodes[0].offsetHeight / 2) - ((document.body.scrollTop || document.documentElement.scrollTop));
		var swapEle = -1;
		var swapRoot = 'ET-';
		var effectEles = document.getElementById('editorTree').childNodes;
		var reorderEffectEle = document.getElementById(reorderEffect);
		for (i = 0; i < effectEles.length; i++) {
			if (effectEles[i] != reorderEffectEle) {
				//if (i == effectEles.length - 1) { console.log(newY, reorderEffectEle.offsetTop, effectEles[i].offsetTop); }
				if (newY > effectEles[i].offsetTop && reorderEffectEle.offsetTop < effectEles[i].offsetTop) {
					swapEle = i;
				}
				if (newY < effectEles[i].offsetTop && reorderEffectEle.offsetTop > effectEles[i].offsetTop) {
					swapEle = i;
				}
				if (effectEles[i].getAttribute('class') == 'effectTree' && newY > effectEles[i].offsetTop && newY < effectEles[i].offsetTop + effectEles[i].offsetHeight) {
					swapEle = i;
					if (swapRoot == 'ET-') { swapEle--; }
					swapRoot += (i - 1) + '-';
					//We're 
					//console.log('In a list!');
					//So now we need to work our where and be recursive
				}
			}
		}
		if (swapEle > -1) {
			console.log(swapRoot + swapEle);
			reorderEffectEle = document.getElementById(swapRoot + swapEle).parentNode.insertBefore(reorderEffectEle, document.getElementById(swapRoot + swapEle));
			/*var swapElement = document.getElementById(swapRoot + swapEle);
			t1 = reorderEffectEle.cloneNode(true);
			t2 = swapElement.cloneNode(true);
			reorderEffectEle.parentNode.replaceChild(t2, reorderEffectEle);
			if (swapElement.parentNode == null) { return; }
			swapElement.parentNode.replaceChild(t1, swapElement);
			reorderEffectEle = t1;*/
		//}
	//}
	/* */
}

function mousedown(e) {
	if (!e) {
		var selectedEle = window.event.srcElement;
	} else {
		var selectedEle = e.target;
	}
	if (selectedEle.className || selectedEle.parentNode.parentNode.className != "menu") { document.getElementById('taskmenu').style.display = 'none'; }
	if (selectedEle && selectedEle.id && selectedEle.className == "titlebar" && e.which == 1) { mdti = selectedEle.id.substr(1); };

	while (selectedEle && selectedEle.className.substr(0, 6) != 'window' && selectedEle != null && selectedEle != document.body) {
		selectedEle = selectedEle.parentNode;
	}

	wID = selectedEle.id.substr(1);
	if (wID != undefined && wID != wzi[wzi.length - 1] && wzi.length > 1) {
		sortWindowsZIndex(wID);
	}

	/*var effectEle = e.target || window.event.srcElement;
	var testForEffect = effectEle;
	while (testForEffect && testForEffect.parentNode && testForEffect.parentNode.id != 'editorTree' && testForEffect != null && testForEffect != document.body) {
		testForEffect = testForEffect.parentNode;
	}
	if (e.button == 0 && !blockEffectMove && testForEffect.parentNode.id == "editorTree" && effectEle.id != "ET-Main") {
		blockEffectMove = true;
		if (reorderEffect != null) { mouseUp(e); }
		displayEffectView(e);
		currentStageOrder = Array(); nPos = 0;
		for (i in document.getElementById('editorTree').childNodes) {
			if (!isNaN(i) && document.getElementById('editorTree').childNodes[i]) {
				currentStageOrder[nPos] = document.getElementById('editorTree').childNodes[i].id;//.substr(5)
				++nPos;
			}
		}
		reorderEffect = effectEle.id;
		tempEl = effectEle.offsetParent;
		blah = (document.body.scrollTop || document.documentElement.scrollTop) -
			(document.getElementById('editorTree').scrollTop || document.getElementById('editorTree').scrollTop);
		var stageListY = document.getElementById('editorTree').offsetTop;
		tempEl = document.getElementById('editorTree').offsetParent;
		while (tempEl.getAttribute('class') != 'window') {
			stageListY += tempEl.offsetTop;
			tempEl = tempEl.offsetParent;
			//if (tempEl.getAttribute('class') == 'window') { stageListY += tempEl.offsetTop; }
		}
		//tmpEffect.style.top = mousePos[1] - stageListY - 9 - blah + "px";
		//tmpEffect.style.top = mousePos[1] - stageListY + 5 - blah + "px";
		//We'd like a hand cursor
		document.body.style.cursor = "n-resize";
	}*/
}

function mouseup(e) {
	mdti = -1;
	if (mdwi != -1) {
		document.getElementById('w' + mdwi).style.opacity = 1;
		mdwi = -1;
	}
	if (wrid != -1 && e.button == 0) {
		wrid = -1;
		windows[wID].resize = {"state": 0, "x": 0, "y": 0};
	}
	/*if (reorderEffect != null) {
		reorderEffect = null;
		//Okay now we need to:
		// Reorder the stage names
		// Reorder the performances
		// Sort out the id="stage" numbering
		// reapply listeners
		//Rebuild the planner
		
		//plannerOld = clone(planner);
		//editorTreeOld = editorTree.slice(0);
		//stageColsOld = stageCols.slice(0);
		newOrder = Array(); nPos = 0;
		for (i in document.getElementById('editorTree').childNodes) {
			if (!isNaN(i) && document.getElementById('editorTree').childNodes[i]) {
				newOrder[document.getElementById('editorTree').childNodes[i].id] = currentStageOrder[nPos];
				++nPos;
			}
		}*/
		/*numDays = Math.max(Math.min(document.getElementById('numdays').innerHTML, 7), 1);
		for (d = 0; d < numDays; d++) {
			for (i in editorTree) {
				if (isNaN(i) || editorTree[i] == null) { continue; }
				for (a = 0; a < plannerOld.length; a++) {
					if (plannerOld[a] && plannerOld[a].id != null && plannerOld[a].day == d && plannerOld[a].stage == i) {
						planner[a].stage = newOrder[i];
					}
				}
			}
		}
		for (i in editorTree) {
			if (isNaN(i) || editorTree[i] == null) { continue; }
			editorTree[newOrder[i]] = editorTreeOld[i];
			stageCols[newOrder[i]] = stageColsOld[i];
		}*//*

		buildEditorTree();
		blockEffectMove = false;
	}*/
	document.body.style.cursor = '';
}

function imgLoaded(idx, iidx) {
	imgobj = document.getElementById("OBJ" + idx);
	imgobj.style.backgroundImage = 'url(' + imgs[iidx].src + ')';
	imgobj.style.width = imgs[iidx].width + "px";
	imgobj.style.height = imgs[iidx].height + "px";
}

function dndCancel(e) {
	e.stopPropagation();
	e.preventDefault();
	return false;
}

function dropHandler(event) {
	event.stopPropagation();
	event.preventDefault();
}

function sortWindowsZIndex(topid) {
	var tWO = []; //temp window order
	for (var i = 0; i < wzi.length; i++) {
		if (wzi[i] != topid || windows[wzi[i]] != null) {
			tWO.push(wzi[i]);
		}
	}
	if (topid && windows[topid] != null) {
		tWO.push(topid);
		//document.getElementById(wID).className = 'titlebar active';
	}

	for (var i = 0; i < tWO.length; i++) {
		document.getElementById('w' + tWO[i]).style.zIndex = i;
		document.getElementById('w' + tWO[i]).setAttribute('class', 'window' + (i == tWO.length - 1 ? ' activeWindow' : ''));
	}
	wzi = tWO;
}

//Shouldn't be broken, but the above kinda makes it buggy?
function closeWindow(evt, id) {
	if (evt.which == 1) {
		if (windows[id].close) { windows[id].close(id); }
		/*delete wzi[wzi.length - 1];
		wzi = wzi.join().split();
		delete windows[id];*/
		windows[id] = null;
		sortWindowsZIndex(id);
		mdti = -1;

		document.getElementById('w' + id).style.pointerEvents = "none";
		fadeOut('w' + id);
		if (document.getElementById('tb' + id)) {
			document.getElementById('tb' + id).style.pointerEvents = "none";
			fadeOut('tb' + id);
		}
	};
}

function showWindow(id, show) {
	if (show && document.getElementById('w' + id).style.display != 'none') {
		if (wzi[wzi.length - 1] == id) {
			document.getElementById('w' + id).style.display = 'none';
		} else {
			sortWindowsZIndex(id);
		}
	} else {
		document.getElementById('w' + id).style.display = show ? 'block' : 'none';
		if (show) { sortWindowsZIndex(id); }
	}
}

function startWindowResize(e) {
	var wID = e.target.id.substr(2);
	if (!windows[wID] || windows[wID] == null || e.button != 0) { return; }
	windows[wID].resize = {"state": 1, "x": e.pageX, "y": e.pageY};
	wrid = wID;
	document.body.style.cursor = 'nwse-resize';
}

function newWindow(info) {
//NEED TO SORT OUT THE IDs GIVEN TO ELEMENTS, LOTS ARE STARTING WITH A NUMBER WHICH IS NOT VALID.
	/*name
	caption
	icon
	width
	height
	resizeable

	top
	left

	always on top
	state - min max normal
	mintotray
	fixed*/
	var wID = windows.push(info) - 1;
	windows[wID].wID = wID;
	if (!windows[wID].icon) { windows[wID].icon = 'appicon2.png'; }
	if (!windows[wID].caption) { windows[wID].caption = 'Window ' + wID; }
	var newWin = document.createElement('div');
	newWin.className = 'window';
	newWin.id = 'w' + wID;
	if (windows[wID].name) { newWin.name = windows[wID].name; }
	newWin.innerHTML = '<div id="t' + wID + '" class="titlebar">' +
		'<div class="titlebarIcon" style="background-image: url(' + windows[wID].icon + ')"></div><div class="titlebarCaption">' + windows[wID].caption + '</div>' +
		'<div class="titlebarButton" title="Close" onclick="closeWindow(event, ' + wID + ')"></div><div class="titlebarButton"></div><div class="titlebarButton" title="Minimize" onclick="showWindow(' + wID + ', false)"></div></div>' +
		'<div id="f' + wID + '" class="form">' + (windows[wID].form ? windows[wID].form : '') + '</div><div class="winb"></div>' + (info.resizeable ? '<div class="winresize windowCurve" id="wr' + wID + '"></div>' : '');
	newWin.style.width = windows[wID].width ? windows[wID].width + "px" : "auto";
	newWin.style.height = windows[wID].height ? windows[wID].height + 22 + "px": "auto";

	document.getElementById("windowcontainer").appendChild(newWin);

	if (!windows[wID].pos) {
		windows[wID].pos = {x: -1, y: -1};
	}
	if (windows[wID].pos.x != -1) {
		newWin.style.left = windows[wID].pos.x + "px";
	} else {
		windows[wID].pos.x = (window.innerWidth - newWin.offsetWidth) / 2
		newWin.style.left = windows[wID].pos.x + "px";
	}
	if (windows[wID].pos.y != -1) {
		newWin.style.top = windows[wID].pos.y + "px";
	} else {
		windows[wID].pos.y = (window.innerHeight - newWin.offsetHeight - 22) / 2
		newWin.style.top = windows[wID].pos.y + "px";
	}
	newWin.style.zIndex = wzi.push(wID) - 1; //we don't support always on top order yet.
	sortWindowsZIndex(wID); //Sort the windows here to change the active window CSS

	if (info.minwidth) { newWin.style.minWidth = info.minwidth + "px"; }

	if (info.resizeable) {
		windows[wID].resize = {"state": 0, "x": 0, "y": 0}; //Resizing info
		eventHook(document.getElementById("wr" + wID), "mousedown", startWindowResize);
	}
	
	if (info.init) { windows[wID].init = info.init; windows[wID].init(); }

	if (info.close) { windows[wID].close = info.close; }

	newItem = document.createElement('div');
	newItem.className = 'tbwindow';
	newItem.id = 'tb' + wID;
	var showthis = function(id){return function(){showWindow(id, true);sortWindowsZIndex(id);}}; showthis = showthis(wID);
	eventHook(newItem, 'click', showthis);
	newItem.innerHTML = '<div class="titlebarIcon" style="background-image: url(' + windows[wID].icon + ')"></div>' + windows[wID].caption;
	document.getElementById("appholder").appendChild(newItem);
}

function buildEditor(wID) {
	//document.getElementById(wID + 'f').innerHTML += '<div class="winnav"><input type="button" value="&#9650;" title="Up" /><input type="text" /><input type="button" value="&#9654;" title="Go" /><input type="button" value="Hello"/></div><div class="wincontent"><div id="editorStatusbar">60.0 FPS @ 640x480 - Preset Name</div></div>';
}

function newEditorWindow() {
	//Need to make sure there is only one of these at a time!
	//newWindow({"caption": "WebVS Editor", "icon": "brush_light_icon.png", "width": 640, "height": 480, "resizeable": true, "init": function() { buildEditor(this.wID)}});
	newWindow({"caption": "WebVS Editor", "icon": "icon.png", "width": 640, "height": 480, "minwidth": 320, "resizeable": true, "form": '<div class="winnav"><!--<input type="button" value="&#9650;" title="Up" /><input type="text" /><input type="button" value="&#9654;" title="Go" />--><input type="button" value="Hello"/></div><div id="editorTreeHost"><div id="editorTreeButtons"><input style="float:right" type="button" value=" - "/><input type="button" value=" + "/><input type="button" value="x2"/></div><div id="editorTree"></div></div><div id="effectHost"><fieldset><legend id="effectTitle">No effect/setting selected</legend><div id="effectContainer"></div></fieldset></div><div id="editorStatusbar">60.0 FPS @ 640x480 - Preset Name</div>', "init": buildEditorTree});
}

function toggleTaskMenu(e) {
	if (!e) var e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();

	taskMenu = document.getElementById('taskmenu').style;
	taskMenu.display = taskMenu.display == 'block' ? 'none' : 'block';
}

function hideTaskMenu() {
	document.getElementById('taskmenu').style.display = 'none';
}

function setTrayClock() {
	//this code looks a bit crap
	now = new Date();
	hours = now.getHours();
	minutes = now.getMinutes();
	if (hours < 10){ hours = "0" + hours; }
	if (minutes < 10){ minutes = "0" + minutes; }
	if (document.getElementById("trayclock").innerHTML.substr(0, 2) != hours) {
		day = now.getDate() + ''; ldd = day.substr(-1, 1);
		if (ldd == 1) { day += 'st'; } else if (ldd == 2) { day += 'nd'; } else if (ldd == 3) { day += 'rd'; } else { day += 'th' }
		document.getElementById("trayclock").title = day + ' of ' + months[now.getMonth()] + ', ' + now.getFullYear();
	}
	document.getElementById("trayclock").innerHTML = hours + ':' + minutes;
}

/*function areaVis(e) {
	//probably should fade in/out
	if (e.type == 'mouseout') {
		area.style.visibility = 'hidden';
	} else {
		area.style.visibility = '';
	}
}*/

function buildEditorTree() {
	if (!preset.components) { alert('What is up with this preset?'); return; }

	document.getElementById('editorTree').innerHTML = ''; //Clear the tree

	//build a "Main" element
	/*for (var i = 0; i < effectInfo.main; i++) {
		
	}*/

	//populate "Main"
	/*for (var i in preset) {
		if (i != 'components') {
		}
	}*/

	//
	var newEffect = document.createElement('div');
	newEffect.innerHTML = 'Main';
	newEffect.id = "ET-Main";
	eventHook(newEffect, 'click', displayEffectView);
	document.getElementById('editorTree').appendChild(newEffect);

	recursiveTreePopulate(preset.components, document.getElementById('editorTree'), 'ET');

	if (selectedEffect && typeof selectedEffect == "string") {
		selectedEffect = document.getElementById(selectedEffect);
		selectedEffect.setAttribute('class', selectedEffect.getAttribute('class') + ' selectedEffect');
	}
}

function recursiveTreePopulate(branch, parent, id) {
	for (i in branch) {
		//console.log(i, branch[i]);
		var newEffect = document.createElement('div');
		newEffect.id = id + '-' + i;
		newEffect.innerHTML = branch[i].type;
		eventHook(newEffect, 'click', displayEffectView);
		parent.appendChild(newEffect);

		if (branch[i].type == 'EffectList') {
			recursiveTreePopulate(branch[i].components, newEffect, id + '-' + i);
			newEffect.setAttribute('class', 'effectTree');
		}
	}
}

function displayEffectView(e) {
	if (!e) var e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();

	if (selectedEffect) { //remove selected state from the current element
		selectedEffect.setAttribute('class', selectedEffect.getAttribute('class') != '' ? selectedEffect.getAttribute('class').split(' ')[0] : '');
	}

	var treePos = e.target.id.substr(3).split("-");
	if (treePos == 'Main') {
		document.getElementById('effectContainer').innerHTML = 'Main';
	} else {
		var node = preset.components[treePos[0]];
		if (treePos.length > 1) {
			for (var i = 1; i < treePos.length; i++) {
				node = node.components[treePos[i]];
			}
		}
		var thisEffect = typeof effectInfo[node.type] != 'undefined' ? effectInfo[node.type] : effectInfo.unknown;
		var thisEffectHTML = '';
		if (thisEffect.name == 'Unknown') {
			thisEffectHTML = JSON.stringify(node);
		} else {
			for (var i in node) {
				if (i == 'type') { continue; }
				/*if (typeof i == 'object' && thisEffect[i]) {
					recursivePaneBuild(thisEffect[i], node[i], thisEffectHTML);
				} else {
					thisEffectHTML += i + ":" + node[i] + "<br />";
				}*/
				//console.log(thisEffect.pane[i], node[i]);
				//if (i == 'style') { console.log(thisEffect
				if (!thisEffect.pane[i].control) {
					for (var k in node[i]) {
						thisEffectHTML += buildPaneElement(thisEffect.pane[i][k], node[i][k], k, i);
					}
				} else {
					thisEffectHTML += buildPaneElement(thisEffect.pane[i], node[i], i, '');
				}
			}
		}
		document.getElementById('effectContainer').innerHTML = thisEffectHTML;
		document.getElementById('effectTitle').innerHTML = thisEffect.name;
	}
	selectedEffect = e.target; //add the selected state to the chosen element
	selectedEffect.setAttribute('class', selectedEffect.getAttribute('class') + ' selectedEffect');
}

/*function recursivePaneBuild(effect, node, output) {
	for (var i in node) {
		if (typeof i == 'object' && effect[i]) {
			recursivePaneBuild(effect[i], node[i], thisEffectHTML);
		} else {
			thisEffectHTML += i + ":" + node[i] + "<br />";
		}
	}
}*/

function buildPaneElement(typeInfo, data, name, parent) {
	if (typeof data == 'undefined' || !typeInfo.control) { return ''; }
	var thisID = (parent != '' ? parent + '-' : '') + name;
	var output = '<div class="paneElementHost">'
	if (typeInfo.label) {	output += "<div>" + typeInfo.label + "</div>"; }
	switch (typeInfo.control) {
		case control_null:
			//
			break;
		case control_code:
			output += '<div class="popOutLink" onclick="popOutThis(event);">\u2197</div><textarea id="' + thisID + '" style=\"width:100%;height:50px;resize: vertical;\">' + data + '</textarea>';
			break;
		case control_text:
			//break;
		case control_number:
			//break;
		case control_radio:
			for (var o in typeInfo.options) {
				output += '<label>' + typeInfo.options[o] + '<input type="radio" name="' + thisID + '"' + (o == data ? ' checked' : '') + '/></label> ';
			}
			break;
		case control_check:
			//break;
		case control_colour:
			//break;
		case control_colour_bar:
			//break;
		case control_button:
			//break;
		case control_dropdown:
			//break;
		case control_slider:
			//break;
		case control_label:
			//break;
		default:
			output += JSON.stringify(typeInfo);
	}
	/*if (!data.control) {
		for (var i = 0; i < typeInfo.length; i++) {
			console.log(typeInfo[i], data[i]);
			output += buildPaneElement(typeInfo[i], data[i]);
		}
	} else {
		console.log(typeInfo, data);
	}*/
	return output + '</div>';
}

function popOutThis(e) {
	//Get the effect ID
	var effectElement = e.target.parentNode;
	var effectID;
	for (var i = 0; i < effectElement.childNodes.length; i++) {
		console.log(effectElement.childNodes[i]);
		if (effectElement.childNodes[i].id) {
			effectID = effectElement.childNodes[i].id.split('-');
			effectElement.childNodes[i].disabled = 'disabled';
			break;
		}
	}

	newWindow({"caption": selectedEffect.id + '-&gt;' + effectID.join('-'), "icon": "icon.png", "width": 240, "height": 320, "resizeable": true, "form": '', "close": popOutCloseThis});
}

function popOutCloseThis(id) {
	//document.getElementById('w' + id)
}

function init() {
	area = document.getElementById("area");
	eventHook(document, "mousemove", mousemove);
	eventHook(document, "mousedown", mousedown);
	eventHook(document, "mouseup", mouseup);
	/*wrf = function() {
		document.body.style.height = window.innerHeight - 22 + "px";
		area.style.height = window.innerHeight + "px";
		area.style.width = window.innerWidth + "px";
	}; wrf();
	eventHook(window, "resize", wrf);*/
	//eventHook(document, "click", hideTaskMenu); //And other stuff? hmmm :S
	eventHook(document, "keypress", keypress);
	//eventHook(document, "mouseover", areaVis);
	//eventHook(document, "mouseout", areaVis);
	eventHook(document, "drop", dropHandler);
	eventHook(document, "dragover", dndCancel);
	eventHook(document, "dragenter", dndCancel);
	setInterval(setTrayClock, 1000); setTrayClock(); //This needs improving. We can get the update tick in sync, copy what was done for offline planner
	newEditorWindow();
	//We need some way of registering windows onload, that'll let us add them to menus and stuff if they want to be placed on one.
}

eventHook(window, "load", init);