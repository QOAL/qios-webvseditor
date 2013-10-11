var mousePos = [-1, -1], oMousePos = [-1, -1];

var windows = new Array(); wzi = new Array(); imgs = new Array();
var mdti = -1; //mouse down titlebar index
var mdwi = -1;
var wrid = -1; //Window resize ID
var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

var area;
var selectedEffect = null;
var reorderEffect = null, tmpEffect = null, dummyEffect = null, blockEffectMove = false, currentEffectOrder = [];

var poppedOut = [];

/*
	Look at using flexbox for layout

	Remember to change "load example" to load preset, where the user can have their own presets for effects
	Also need to add the expression help window

	Oh yeah, this editor should have language support I guess

	It would be cool to have a little icon for each element type.
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
		"type": ""
	},
	"Main": {
		"name": "Main",
		"type": "",
		"pane": {
			"clearFrame": { label: "Clear every frame:", control: control_check, "default": false },
			"name": { label: "Preset name:", control: control_text },
			"author": { label: "Author:", control: control_text }
		}
	},
	"Comment": {
		"name": "Comment",
		"type": "Misc"
		/* We currently need to handle this specially */
	},
	"EffectList": {
		"name": "Effect List",
		"type": "",
		"pane": {
			"enabled": { label: "Enabled:", control: control_check, "default": true },
		}
	},
	"SuperScope": {
		"name": "SuperScope",
		"type": "Render",
		"pane": {
			"code": {
				"init": { label: "Init", control: control_code, "height": 30 },
				"perFrame": { label: "Per Frame", control: control_code, "height": 60 },
				"onBeat": { label: "On Beat", control: control_code },
				"perPoint": { label: "Per Point", control: control_code, "height": 80 }
			},
			"source": { label: "Source data:", control: control_radio, "options": ["Waveform", "Spectrum"], "default": 0 },
			"audioChannel": { label: "Channel:", control: control_radio, "options": ["Left", "Centre", "Right"], "default": 1 },
			"lineType": { label: "Draw as:", control: control_radio, "options": ["Dots", "Lines"], "default": 1},
			"colour": {
				"count": { label: "Cycle through", control: control_number },
				"list": { label: "Colours (Max 16)", control: control_colour_bar}
			}
		}
	},
	"DynamicMovement": {
		"name": "Dynamic Movement",
		"type": "Trans",
		"pane": {
			"code": {
				"init": { label: "Init", control: control_code, "height": 30 },
				"perFrame": { label: "Per Frame", control: control_code, "height": 60 },
				"onBeat": { label: "On Beat", control: control_code },
				"perPoint": { label: "Per Pixel", control: control_code, "height": 80 }
			},
			"coordinates": { label: "Rectangular coordinates:", control: control_check, "default": false }
		}
	},
	"Blur": {
		"name": "Blur",
		"type": "Trans",
		"pane": {
			"blur": { label: "Strength:", control: control_radio, "options": ["None", "Light", "Medium", "Heavy"], "default": 2 },
			"rounding": { label: "Rounding:", control: control_radio, "options": ["Down", "Up"], "default": 0 }
		}
	}
};

var preset = {};


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

function lameHTMLSpecialChars(str) {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
	if (selectedEle.className || selectedEle.parentNode.parentNode.className != "menu") { //I don't really like this menu hiding code.
		document.getElementById('taskmenu').style.display = 'none';
		if (!selectedEle.id || selectedEle.id.substr(0, 5) != 'menu-') { document.getElementById('newEffectListHost').style.display = 'none'; }
	}
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
		'<div class="titlebarButton" title="Minimize" onclick="showWindow(' + wID + ', false)"></div><div class="titlebarButton"></div><div class="titlebarButton" title="Close" onclick="closeWindow(event, ' + wID + ')"></div></div>' +
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

	return wID; //might be useful
}

function buildEditor(wID) {
	//document.getElementById(wID + 'f').innerHTML += '<div class="winnav"><input type="button" value="&#9650;" title="Up" /><input type="text" /><input type="button" value="&#9654;" title="Go" /><input type="button" value="Hello"/></div><div class="wincontent"><div id="editorStatusbar">60.0 FPS @ 640x480 - Preset Name</div></div>';
}

function newEditorWindow() {
	//Need to make sure there is only one of these at a time!
	//newWindow({"caption": "WebVS Editor", "icon": "brush_light_icon.png", "width": 640, "height": 480, "resizeable": true, "init": function() { buildEditor(this.wID)}});
	var editorMarkup = '<div class="winnav"><input type="button" value="Hello"/></div>' +
				'<div id="editorTreeHost"><div id="editorTreeButtons"><input style="float:right" type="button" value=" - " onclick="removeSelected()" />' +
				'<input type="button" value=" + " onclick="document.getElementById(\'newEffectListHost\').style.display = \'block\';" /><div class="menu" id="newEffectListHost"><ul></ul></div>' +
				'<input type="button" value="x2" onclick="duplicatedSelected()" /></div><div id="editorTree"></div></div>' +
				'<div id="effectHost"><fieldset><legend id="effectTitle">No effect/setting selected</legend><div id="effectContainer"></div></fieldset></div>' +
				'<div id="editorStatusbar">60.0 FPS @ 640x480 - Preset Name</div>';
	newWindow({"caption": "WebVS Editor", "icon": "icon.png", "width": 640, "height": 480, "minwidth": 320, "resizeable": true, "form": editorMarkup, "init": buildEditorTree});

	buildEffectMenu();
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

	var newEffect = document.createElement('div');
	newEffect.innerHTML = 'Main';
	newEffect.id = "ET-Main";
	eventHook(newEffect, 'click', displayEffectView);
	document.getElementById('editorTree').appendChild(newEffect);

	recursiveTreePopulate(preset.components, document.getElementById('editorTree'), 'ET');

	if (selectedEffect && typeof selectedEffect == "string") {
		selectedEffect = document.getElementById(selectedEffect);
		selectedEffect.setAttribute('class', (selectedEffect.getAttribute('class') && selectedEffect.getAttribute('class').indexOf('effectTree') != -1 ? 'effectTree ' : '') + 'selectedEffect');
	}
}

function recursiveTreePopulate(branch, parent, id) {
	for (i in branch) {
		//console.log(i, branch[i]);
		var newEffect = document.createElement('div');
		newEffect.id = id + '-' + i;
		var treeName = '';
		if (typeof effectInfo[branch[i].type] != 'undefined') {
			treeName = (effectInfo[branch[i].type].type != "" ? effectInfo[branch[i].type].type + ' / ' : '') + effectInfo[branch[i].type].name;
		} else {
			treeName = effectInfo.unknown.name + ' (' + branch[i].type + ')';
		}
		newEffect.innerHTML = lameHTMLSpecialChars(treeName);
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

	if (e.layerY > 18 && e.target.getAttribute('class') && e.target.getAttribute('class').indexOf('effectTree') != -1) { return; }

	if (selectedEffect) { //remove selected state from the current element
		if (selectedEffect == e.target) { return; } //No point building the pane again in this case.
		selectedEffect.setAttribute('class', selectedEffect.getAttribute('class') && selectedEffect.getAttribute('class').indexOf('effectTree') != -1 ? 'effectTree' : '');
	}

	var treePos = e.target.id.substr(3).split("-");
	var thisEffectHTML = '';
	if (treePos == 'Main') {
		var thisEffect = effectInfo.Main;
		for (var i in thisEffect.pane) {
			thisEffectHTML += buildPaneElement(thisEffect.pane[i], preset.components[i] ? preset.components[i] : (preset[i] ? preset[i] : ''), i, '');
		}
	} else {
		var node = preset.components[treePos[0]];
		if (treePos.length > 1) {
			for (var i = 1; i < treePos.length; i++) {
				node = node.components[treePos[i]];
			}
		}
		var thisEffect = typeof effectInfo[node.type] != 'undefined' ? effectInfo[node.type] : effectInfo.unknown;
		if (thisEffect.name == 'Unknown') {
			thisEffectHTML = JSON.stringify(node);
		} else if (thisEffect.name == 'Comment') { //specialise the comment pane
			var theComment = node.text ? node.text : '';
			thisEffectHTML = '<textarea id="text" style="width:100%;resize:none;font-family:arial;font-size:11px;height:calc(100% - 6px);margin:0;" onchange="updatePreset(event)">' + theComment + '</textarea>';
		} else {
			for (var i in thisEffect.pane) {
				for (var k in thisEffect.pane[i]) { //Try an iterate through this pane element
					if (typeof thisEffect.pane[i][k] == 'object') { //If it has children handle them
						thisEffectHTML += buildPaneElement(thisEffect.pane[i][k], node[i] && node[i][k] ? node[i][k] : '', k, i);
					} else { //This is something without children so break the element loop
						thisEffectHTML += buildPaneElement(thisEffect.pane[i], node[i] ? node[i] : '', i, '');
						break;
					}
				}
				//thisEffectHTML += buildPaneElement(thisEffect.pane[i], node[i] ? node[i] : '', i, '');
			}
		}
	}
	document.getElementById('effectContainer').scrollTop = 0;
	document.getElementById('effectContainer').innerHTML = thisEffectHTML;
	document.getElementById('effectTitle').innerHTML = thisEffect.name;

	selectedEffect = e.target; //add the selected state to the chosen element
	selectedEffect.setAttribute('class', (selectedEffect.getAttribute('class') && selectedEffect.getAttribute('class').indexOf('effectTree') != -1 ? 'effectTree ' : '') + 'selectedEffect');
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
	if (typeof data == 'undefined' || typeof typeInfo.control == 'undefined') { return ''; }
	var thisID = (parent != '' ? parent + '-' : '') + name;
	var output = '<div class="paneElementHost">'
	if (typeInfo.label) {	output += "<div" + (typeInfo.control != control_code ? ' style="display:inline;margin-right:5px;" ' : '') + ">" + typeInfo.label + "</div>"; }
	switch (typeInfo.control) {
		case control_null:
			//
			break;
		case control_code:
			output += '<div class="popOutLink" onclick="popOutThis(event);">\u2197</div><textarea id="' + thisID + '" style="width:100%;height:' + (typeInfo.height ? typeInfo.height : '50') + 'px;resize:vertical;" onchange="updatePreset(event)">' + data + '</textarea>';
			break;
		case control_text:
			output += '<input id="' + thisID + '" type="text" onchange="updatePreset(event)" value="' + data + '"/>';
			//break;
		case control_number:
			//break;
		case control_radio:
			for (var o in typeInfo.options) {
				output += '<label>' + typeInfo.options[o] + '<input type="radio" name="' + thisID + '"' + (o == data ? ' checked' : '') + '/></label> ';
			}
			break;
		case control_check:
			output += '<input type="checkbox" name="' + thisID + '"' + (data ? ' checked' : '') + '/>';
			break;
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
		if (effectElement.childNodes[i].id) {
			effectID = effectElement.childNodes[i].id;
			break;
		}
	}

	var popID = selectedEffect.id + '_' + effectID;

	if (poppedOut.indexOf(popID) != -1) {
		return; //This element has already been popped out. We should not hit this.
	}
	poppedOut.push(popID);
	e.target.style.display = "none";
	effectElement.childNodes[i].disabled = 'disabled';

	var treePos = selectedEffect.id.substr(3).split('-');
	var node = preset.components[treePos[0]];
	var treeTrail = effectInfo[node.type].name; //Build a string to give the user an idea of where this element belongs.
	if (treePos.length > 1) {
		for (var i = 1; i < treePos.length; i++) {
			node = node.components[treePos[i]];
			treeTrail += ' &gt; ' + effectInfo[node.type].name;
		}
	}

	if (effectID.substr('-')) {
		effectID = effectID.split('-');
		var effectElement = effectInfo[node.type].pane[effectID[0]][effectID[1]];
		var effectData = node[effectID[0]][effectID[1]];
	} else {
		var effectElement = effectInfo[node.type].pane[effectID];
		var effectData = node[effectID];
	}

	var popoutMarkup = '<div class="popoutHost"><textarea class="popoutElement" id="' + popID + '" onchange="updatePreset(event)" wrap="off">' + (effectData ? effectData : '') + '</textarea><div class="popoutStatusBar" onclick="selectFromPopout(event)" title="Click to select this effect in the editor">' + treeTrail + '</div></div>';
	var wID = newWindow({"caption": selectedEffect.textContent + ' &gt; ' + e.target.parentNode.childNodes[0].textContent, "icon": "icon.png", "width": 320, "height": 320, "resizeable": true, "form": popoutMarkup, "close": popOutCloseThis});
	windows[wID].popID = [selectedEffect.id, effectID];
}

function popOutCloseThis(id) {
	//Remove it from the popped out list
	poppedOut[poppedOut.indexOf(windows[id].popID[0] + '_' + windows[id].popID[1].join('-'))] = null;

	//If we're on the pane where this element belongs then:
	var tmpID = windows[id].popID[1].join('-');
	if (selectedEffect.id == windows[id].popID[0] && document.getElementById(tmpID)) {
		document.getElementById(tmpID).disabled = ''; //Re-enable the textarea
		document.getElementById(tmpID).parentNode.childNodes[1].style.display = ''; //Show the popout link again
	}
	
}

function selectFromPopout(e) {
	var targetEffect = e.target.parentNode.childNodes[0].id.split('_')[0];
	var evt = document.createEvent("MouseEvents");
	evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	document.getElementById(targetEffect).dispatchEvent(evt);
}

function duplicatedSelected() {
	if (!selectedEffect || selectedEffect.id == 'ET-Main') { return; }

	var treePos = selectedEffect.id.substr(3).split('-');
	var node = preset.components[treePos[0]];
	if (treePos.length > 1) {
		for (var i = 1; i < treePos.length - 1; i++) { //We want to land on the effects parent node
			node = node.components[treePos[i]];
		}
		node.components.splice(Math.max(0, treePos[i]), 0, node.components[treePos[i]]);
	} else { //This is a root element
		preset.components.splice(Math.max(0, treePos[0]), 0, node);
	}


	buildEditorTree();

	//Select the original effect
	treePos[treePos.length - 1]++;
	var evt = document.createEvent("MouseEvents");
	evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	document.getElementById('ET-' + treePos.join('-')).dispatchEvent(evt);

	//This is where webvs would be given the updated preset
}

function removeSelected() {
	if (!selectedEffect || selectedEffect.id == 'ET-Main') { return; }

	var treePos = selectedEffect.id.substr(3).split('-');
	var node = preset.components[treePos[0]];
	if (treePos.length > 1) {
		for (var i = 1; i < treePos.length - 1; i++) { //We want to land on the effects parent node
			node = node.components[treePos[i]];
		}
		node.components.splice(treePos[i], 1);
	} else { //This is a root element
		preset.components.splice(treePos[0], 1);
	}

	buildEditorTree();

	//Select the effect that moved into the removed effects position
	if (document.getElementById('ET-' + treePos.join('-'))) {
		var newSel = document.getElementById('ET-' + treePos.join('-'));
	} else {
		treePos[treePos.length - 1]--;
		if (document.getElementById('ET-' + treePos.join('-'))) {
			var newSel = document.getElementById('ET-' + treePos.join('-'));
		} else {
			var newSel = document.getElementById('ET-Main');
		}
	}
	var evt = document.createEvent("MouseEvents");
	evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	newSel.dispatchEvent(evt);

	//This is where webvs would be given the updated preset
}

function updatePreset(e) {
	var newValue = e.target.value;
	if (e.target.id.indexOf('_') != -1) { //popped out element
		var tmpID = e.target.id.split('_');
		var tree = tmpID[0];
		var effect = tmpID[1];
		//We should update the pane view here, if it's visible.
		if (selectedEffect.id == tree && document.getElementById(tmpID[1])) {
			document.getElementById(tmpID[1]).value = newValue;
		}
	} else { //in a pane
		var tree = selectedEffect.id;
		var effect = e.target.id;
	}

	if (tree == "ET-Main") {
		if (preset.components[effect]) {
			preset.components[effect] = newValue;
		} else {
			preset[effect] = newValue;
		}
	} else {
		//Walk the tree
		var treePos = tree.substr(3).split('-');
		var node = preset.components[treePos[0]];
		if (treePos.length > 1) {
			for (var i = 1; i < treePos.length; i++) {
				node = node.components[treePos[i]];
			}
		}
		if (effect.substr('-')) {
			effect = effect.split('-');
			node[effect[0]][effect[1]] = newValue;
		} else {
			node[effect] = newValue;
		}
	}

	//This is where webvs would be given the updated preset
}

function addThisEffect(e) {
	//If the tree has no selected elements, then it inserted after the Main node
	//If the selected element is an effects list then the effect is insert as the first child in that list
	//Otherwise it is inserted before the selected effect
	if (!e.target.id || e.target.id.substr(0, 5) != 'menu-') { return; }
	document.getElementById('newEffectListHost').style.display = 'none';

	var newNode = {"type": e.target.id.substr(5)}; //Basic stub node. Unsure if this is okay for the long term.
	if (e.target.id.substr(5) == 'EffectList') { //Effect Lists need a bit more fleshing out to be funcational
		newNode.components = [];
	}

	if (!selectedEffect || selectedEffect.id == 'ET-Main') {
		var treePos = [0]
		preset.components.splice(0, 0, newNode);
	} else {
		var treePos = selectedEffect.id.substr(3).split('-');

		if (selectedEffect.getAttribute('class').indexOf('effectTree') != -1) {
			treePos.push(0); //If an effect list is selected then the new node becomes a child of it.
		}

		var node = preset.components[treePos[0]];
		if (treePos.length > 1) {
			for (var i = 1; i < treePos.length - 1; i++) { //We want to land on the effects parent node
				node = node.components[treePos[i]];
			}
			node.components.splice(Math.max(0, treePos[i]), 0, newNode);
		} else { //This is a root element
			preset.components.splice(Math.max(0, treePos[0]), 0, newNode);
		}
	}


	buildEditorTree();

	//Select the original effect
	var evt = document.createEvent("MouseEvents");
	evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	document.getElementById('ET-' + treePos.join('-')).dispatchEvent(evt);

	//This is where webvs would be given the updated preset
}

function buildEffectMenu() {
	var markup = '', types = ["_"];
	var menu = {"_":[]};

	//Something should be done here for preset loading.
	markup += '<li class="subMenu">Presets<ul><li>None</li></ul><li class="menuspacer"></li>';

	//Fill some arrays with the needed information we need from effectInfo
	for (var i in effectInfo) {
		if (effectInfo[i].name != "Unknown" && effectInfo[i].name != "Main") {
			if (effectInfo[i].type != "") {
				if (!menu[effectInfo[i].type]) { menu[effectInfo[i].type] = []; types.push(effectInfo[i].type); }
				menu[effectInfo[i].type].push(i);
			} else {
				menu["_"].push(i);
			}
		}
	}
	//So now we should sort each part of the list & build the dom
	types.sort();
	for (var i in types) {
		menu[types[i]].sort();
		if (types[i] == "_") { continue; }
		markup += '<li class="subMenu">' + types[i] + '<ul>';
		for (var k in menu[types[i]]) {
			markup += '<li id="menu-' + menu[types[i]][k] + '" onclick="addThisEffect(event)">' + effectInfo[menu[types[i]][k]].name + '</li>';
		}
		markup += '</ul></li>';
	}
	for (var k in menu["_"]) {
		markup += '<li id="menu-' + menu["_"][k] + '" onclick="addThisEffect(event)">' + effectInfo[menu["_"][k]].name + '</li>';
	}
	document.getElementById('newEffectListHost').childNodes[0].innerHTML = markup;
}

function fetchPreset() {
	if (window.XMLHttpRequest) {
		xhrFetch = new XMLHttpRequest();
	} else {
		xhrFetch = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhrFetch.onload = function() {
		if (this.status == 200) {
			preset = JSON.parse(this.responseText);
		} else {
			//Error!
			//this.status + '<br />' + this.responseText;
		}
	};
	xhrFetch.open("get", "Jeheriko_141.webvs", false);
	xhrFetch.send();
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

	fetchPreset();

	newEditorWindow();
	//We need some way of registering windows onload, that'll let us add them to menus and stuff if they want to be placed on one.
}

eventHook(window, "load", init);