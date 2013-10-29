var mousePos = [-1, -1], oMousePos = [-1, -1];

var windows = new Array(); wzi = new Array(); imgs = new Array();
var mdti = -1; //mouse down titlebar index
var mdwi = -1;
var wrid = -1; //Window resize ID
var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

var haveWebVS = 0;
var webVSActive = false;
var dancer, webvs;

var haveWindow = {};

var selectedHelpTab = 'General';

var area, gMenu;
var selectedEffect = null;
var reorderEffect = null, dummyEffect = null, paddingElement = null, reorderInitialY = 0;

var resizeGripper = null;

var reader = new FileReader();

var poppedOut = [];

var editorMenuActive = false;
var editorMenuActiveElement = null;
var navGlobalPos = {'navPreset': 3, 'navEdit': 4, 'navSettings': 5, 'navHelp': 6};
var globalMenus = [
	'',
	'<ul><li onclick="newWindow({\'caption\': \'Blank window\', \'icon\': \'16x16x8_.png\', \'height\': 100});"/><div class="menuicon"></div>New blank window</li><li onclick="newEditorWindow();"><div class="menuicon" style="background:url(icon.png);"></div>WebVS Editor</li></ul>',
	'',
	'<ul><li>Load...</li><li>Save...</li><li class="menuspacer"></li><li>New</li></ul>',
	'<ul><li>Undo</li><li>Redo</li></ul>',
	'<ul><li>Display</li><li>Fullscreen</li><li>Presets/Hotkeys</li><li>Beat Detection</li><li>Transistions</li><li class="menuspacer"></li><li>Debug Window...</li></ul>',
	'<ul><li onclick="newExpressionHelpWindow()">Expression help...</li><li class="menuspacer"></li><li>About...</li></ul>'
];

/*
	Look at using flexbox for layout

	Remember to change "load example" to load preset, where the user can have their own presets for effects
	Also need to add the expression help window

	Oh yeah, this editor should have language support I guess

	It would be cool to have a little icon for each element type.

	Menus can go off the screen. :(
*/

var preset = {"clearFrame": false, "components": []};


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
		if (mdwi == -1) { mdwi = mdti; /*cWin.style.opacity = .625;*/ }
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
		windows[wrid].width = thisWindow.offsetWidth;
		windows[wrid].height = thisWindow.offsetHeight - 22;
	}

	if (resizeGripper != null) {
		if (resizeGripper == 'treeEffectGrip') {
			resizeTarget = document.getElementById('editorTreeHost');
		}
		var tmpLeft = resizeTarget.offsetLeft;
		var tmpEl = resizeTarget.offsetParent;
		while (tmpEl != null) {
			tmpLeft += tmpEl.offsetLeft;
			tmpEl = tmpEl.offsetParent;
		}
		resizeTarget.style.width = Math.min(document.getElementById('treeEffectHost').offsetWidth - 150, Math.max(150, mousePos[0] - tmpLeft)) + "px";
		document.getElementById(resizeGripper).style.left = resizeTarget.offsetWidth + "px";
	}

	if (reorderEffect) {
		if (!dummyEffect && Math.abs(reorderInitialY - mousePos[1]) > 4) {
			//We'd like a hand cursor
			document.body.style.cursor = "n-resize";
			reorderEffect.style.opacity = .375;

			dummyEffect = document.createElement('li');
			dummyEffect.className = 'dummyEffect';
			dummyEffect.textContent = '<Move Here>';
			reorderEffect.parentNode.insertBefore(dummyEffect, reorderEffect);

			//We hide the selected effect BG here, as it'll probably be in the wrong place for duration of the D&D
			document.getElementById('editorTree').childNodes[0].style.display = "";

			//Having this element fixes a bug where when an effect list is the last item in the tree,
			// you'll be unable to drag an effect to the end of the tree, or past the 1st effect in that list.
			//If you can find a better fix then please patch me out. :)
			paddingElement = document.createElement('li');
			paddingElement.style.padding = '0px';
			paddingElement.style.height = '1px';
			document.getElementById('editorTree').childNodes[1].appendChild(paddingElement);
		}

		if (dummyEffect) {
			//Get the effect tree's absolute y position
			var tmpTop = document.getElementById('editorTree').offsetTop;
			var tmpEl = document.getElementById('editorTree').offsetParent;
			while (tmpEl != null) {
				tmpTop += tmpEl.offsetTop;
				tmpEl = tmpEl.offsetParent;
			}

			var adjustedLayerY =  Math.max(20, Math.min(document.getElementById('editorTree').childNodes[1].lastChild.offsetTop + 20,
					(mousePos[1] - tmpTop + document.getElementById('editorTree').scrollTop - 10))) + 10;
			var tmpEl = document.getElementById('editorTree').childNodes[1];
			for (var i = 0; i < tmpEl.childNodes.length; i++) {
				if (adjustedLayerY - tmpEl.childNodes[i].offsetHeight < 1) {
					if (tmpEl.childNodes[i].childNodes && adjustedLayerY > 20 && tmpEl.childNodes[i] != reorderEffect) {
						//be recursive - Yes this is a crappy way of achieving it.
						adjustedLayerY -= 20;
						tmpEl = tmpEl.childNodes[i].childNodes[2]; //Start at the 3rd child - avoids the collapse span + "Effect list" text
						i = -1;
						continue;
					} else {
						//Move the dummy node to correct location in the tree
						if (adjustedLayerY > 10) { //If they're over half way over an element, then try and insert after it
							//First deal with being over the effect list element
							if (tmpEl.childNodes[i].getAttribute('class') && tmpEl.childNodes[i].getAttribute('class').indexOf('effectTree') != -1 && tmpEl.childNodes[i] != reorderEffect) {
								tmpEl.childNodes[i].childNodes[2].insertBefore(dummyEffect, tmpEl.childNodes[i].childNodes[2].firstChild);
							} else if (tmpEl.childNodes[i].nextSibling) { //Now try and insert it after the current element
								tmpEl.childNodes[i].parentNode.insertBefore(dummyEffect, tmpEl.childNodes[i].nextSibling);
							} else { //Otherwise insert it at the end of the current parent
								tmpEl.childNodes[i].parentNode.appendChild(dummyEffect);
							}
						} else { //And this just insert the dummy before the node being hovered over
							tmpEl.childNodes[i].parentNode.insertBefore(dummyEffect, tmpEl.childNodes[i]);
						}
						return; //Uhh we should probably move this code to separate function if we're going to do that.
					}
					break;
				} else {
					adjustedLayerY -= tmpEl.childNodes[i].offsetHeight;
				}
			}
		}
	}
}

function mousedown(e) {
	if (!e) {
		var selectedEle = window.event.srcElement;
	} else {
		var selectedEle = e.target;
	}

	var tEle = selectedEle; //Climb up the tree
	while (tEle && tEle != gMenu) {
		tEle = tEle.parentNode;
	}
	//If we haven't landed on the global menu, hide it.
	if (tEle != gMenu) { hideMenu(); }

	if (selectedEle.getAttribute('class') == "resizeGrip") {
		resizeGripper = selectedEle.id;
		document.body.style.cursor = "col-resize";
	}

	if (selectedEle && selectedEle.id && selectedEle.className == "titlebar" && e.which == 1 && !windows[selectedEle.id.substr(1)].maximised) {
		mdti = selectedEle.id.substr(1);
	}

	while (selectedEle && selectedEle.className.substr(0, 6) != 'window' && selectedEle != null && selectedEle != document.body) {
		selectedEle = selectedEle.parentNode;
	}

	wID = selectedEle.id.substr(1);
	if (wID != undefined && wID != wzi[wzi.length - 1] && wzi.length > 1) {
		sortWindowsZIndex(wID);
	}

	var effectEle = e.target || window.event.srcElement;
	if (effectEle.tagName == 'LI' && effectEle.id.substr(0, 3) == 'ET-' && effectEle.id != 'ET-Main') {
		reorderEffect = effectEle;
		reorderInitialY = mousePos[1];
	}
}

function mouseup(e) {
	mdti = -1;
	if (mdwi != -1) {
		/*document.getElementById('w' + mdwi).style.opacity = 1;*/
		mdwi = -1;
	}
	if (wrid != -1 && e.button == 0) {
		windows[wrid].resize = {"state": 0, "x": 0, "y": 0};
		wrid = -1;
	}
	if (resizeGripper != null) {
		resizeGripper = null;
	}

	if (reorderEffect != null) {
		if (dummyEffect) {
			//Get the node that we're moving
			var oldTreePos = reorderEffect.id.substr(3).split('-');
			var oldNode = preset.components[oldTreePos[0]];
			var oldParent = preset.components;
			if (oldTreePos.length > 1) {
				for (var i = 1; i < oldTreePos.length; i++) {
					oldParent = oldNode.components;
					oldNode = oldNode.components[oldTreePos[i]];
				}
			}
			oldNode.killMe = true; //Mark the node so we can find it if we need to.

			//Find the node where we're moving before.
			for (var g = 0; g < dummyEffect.parentNode.childNodes.length; g++) {
				if (dummyEffect == dummyEffect.parentNode.childNodes[g]) { break; }
			}
			treePos = dummyEffect.parentNode.parentNode.id.substr(3).split('-');
			if (treePos == 'torTree') { treePos = []; g--; } //If it's a root element then correct for that.
			treePos.push(g);
			var node = preset;
			if (treePos.length > 1) {
				node = preset.components[treePos[0]];
				for (var i = 1; i < treePos.length - 1; i++) {
					node = node.components[treePos[i]];
				}
			}
			node = node.components;
			//insert a copy of the old node into the correct place
			if (node[g]) {
				node.splice(g, 0, oldNode);
			} else {
				node.push(oldNode);
			}

			//remove the old node - Yes we need to find it again as it could have moved.
			if (oldParent[oldTreePos[oldTreePos.length - 1]] == oldNode) {
				oldParent.splice(oldTreePos[oldTreePos.length - 1], 1);
			} else {
				for (var i = 0; i < oldParent.length; i++) {
					if (oldParent[i].killMe && i != g) {
						oldParent.splice(i, 1);
						break;
					}
				}
			}
	
			//Find the correct position for our moved node
			for (var k = 0; k < node.length; k++) {
				if (node[k].killMe || (node[k].components && node[k].components.killMe)) {
					treePos[treePos.length - 1] = k;
					break;
				}
			}

			delete oldNode.killMe;

			dummyEffect.parentNode.removeChild(dummyEffect);
			dummyEffect = null;
			paddingElement.parentNode.removeChild(paddingElement);
			paddingElement = null;

			buildEditorTree();

			updateWebVSPreset();

			//Select the newly moved effect
			if (document.getElementById('ET-' + treePos.join('-'))) {
				var evt = document.createEvent("MouseEvents");
				evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				document.getElementById('ET-' + treePos.join('-')).dispatchEvent(evt);
			}
		}
		reorderEffect.style.opacity = '';
		reorderEffect = null;
		reorderInitialY = 0;
	}

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


	//We'll just deal with a single preset for now
	// In the future avs/webvs presets can be shoved in to an array or put in to local storage
	var dropFile = event.dataTransfer.files[0];
	if (!dropFile) { return; }

	//dropFile.name.toLowerCase().substr(-4) == '.avs'
	if (dropFile.name.toLowerCase().substr(-6) != '.webvs') { return; }

	reader.onload = (function() {
		return function(e) {
			var newPreset = JSON.parse(e.target.result);
			//The simple confirm dialog here should be replaced in the future
			if (newPreset && newPreset.components) { // && window.confirm("Overwrite the current preset?")
				preset = newPreset;
				buildEditorTree();
				updateWebVSPreset();
			}
		};
	})();
	reader.readAsText(dropFile);
}

function sortWindowsZIndex(topid) {
	var tWO = []; //temp window order
	for (var i = 0; i < wzi.length; i++) {
		if (wzi[i] != topid || windows[wzi[i]] != null) {
			tWO.push(wzi[i]);
		}
	}

	if (topid > -1 && windows[topid] != null) {
		tWO.push(topid);
	}

	for (var i = 0; i < tWO.length; i++) {
		document.getElementById('w' + tWO[i]).style.zIndex = i;
		var tmpClass = document.getElementById('w' + tWO[i]).getAttribute('class').replace(' activeWindow', '');
		document.getElementById('w' + tWO[i]).setAttribute('class', i == tWO.length - 1 ? tmpClass + ' activeWindow': tmpClass);

		document.getElementById('tb' + tWO[i]).setAttribute('class', i == tWO.length - 1 ? 'tbwindow activeWindow': 'tbwindow');
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
	if (windows[id].maximised) {
		if (document.getElementById('w' + id).style.display == 'none' || wzi[wzi.length - 1] != id) {
			document.getElementById('w' + id).style.display = 'block';
			sortWindowsZIndex(id);
		} else {
			document.getElementById('w' + id).style.display = 'none';
		}
		return;
	}
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

function maximiseWindow(id) {
	windows[id].maximised = !windows[id].maximised;
	var thisWindow = document.getElementById('w' + id);
	var tmpClass = thisWindow.getAttribute('class').replace(' maximised', '');
	thisWindow.setAttribute('class', windows[id].maximised ? tmpClass + ' maximised': tmpClass);
	thisWindow.style.left = (windows[id].maximised ? 0 : windows[id].pos.x) + "px";
	thisWindow.style.top = (windows[id].maximised ? 0 : windows[id].pos.y) + "px";
	thisWindow.style.width = (windows[id].maximised ? area.offsetWidth : windows[id].width) + "px";
	thisWindow.style.height = (windows[id].maximised ? area.offsetHeight - 20 : windows[id].height + 22) + "px";
}

function startWindowResize(e) {
	var wID = e.target.id.substr(2);
	if (!windows[wID] || windows[wID] == null || e.button != 0) { return; }
	windows[wID].resize = {"state": 1, "x": e.pageX, "y": e.pageY};
	wrid = wID;
	document.body.style.cursor = 'nwse-resize';
}

function handleWindowResize(e) {
	//For now we're just making sure maximised windows look correct
	// It would be a good idea to stop normal windows getting lost too.
	var nW = area.offsetWidth + "px", nH = area.offsetHeight - 20 + "px";
	for (var i = 0; i < windows.length; i++) {
		if (windows[i] && windows[i].maximised) {
			document.getElementById('w' + i).style.width = nW;
			document.getElementById('w' + i).style.height = nH;
		}
	}
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
	windows[wID].maximised = false;
	var newWin = document.createElement('div');
	newWin.className = 'window';
	newWin.id = 'w' + wID;
	if (windows[wID].name) { newWin.name = windows[wID].name; }
	newWin.innerHTML = '<div id="t' + wID + '" class="titlebar"' + (!info.disableMaximise ? ' ondblclick="maximiseWindow(' + wID + ')"' : '') + '>' +
		'<div class="titlebarIcon" style="background-image: url(' + windows[wID].icon + ')"></div><div class="titlebarCaption">' + windows[wID].caption + '</div>' +
		'<div class="titlebarButton" title="Minimize" onclick="showWindow(' + wID + ', false)"></div>' + (!info.disableMaximise ? '<div class="titlebarButton" title="Maximise" onclick="maximiseWindow(' + wID + ')"></div>' : '<div class="titlebarButton disabledTitlebarButton"></div>') + '<div class="titlebarButton" title="Close" onclick="closeWindow(event, ' + wID + ')"></div></div>' +
		'<div id="f' + wID + '" class="form">' + (windows[wID].form ? windows[wID].form : '') + '</div><div class="winb"></div>' + (info.resizeable ? '<div class="winresize windowCurve" id="wr' + wID + '"></div>' : '');
	newWin.style.width = windows[wID].width ? windows[wID].width + "px" : "auto";
	newWin.style.height = windows[wID].height ? windows[wID].height + 22 + "px": "auto";

	document.getElementById("windowcontainer").appendChild(newWin);

	if (!windows[wID].width) { windows[wID].width = newWin.offsetWidth; }
	if (!windows[wID].height) { windows[wID].height = newWin.offsetHeight - 22; }

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

	if (info.minwidth) { newWin.style.minWidth = info.minwidth + "px"; }

	if (info.resizeable) {
		windows[wID].resize = {"state": 0, "x": 0, "y": 0}; //Resizing info
		eventHook(document.getElementById("wr" + wID), "mousedown", startWindowResize);
	}
	
	if (info.close) { windows[wID].close = info.close; }

	newItem = document.createElement('div');
	newItem.className = 'tbwindow';
	newItem.id = 'tb' + wID;
	var showthis = function(id){return function(){showWindow(id, true);sortWindowsZIndex(id);}}; showthis = showthis(wID);
	eventHook(newItem, 'click', showthis);
	newItem.innerHTML = '<div class="titlebarIcon" style="background-image: url(' + windows[wID].icon + ')"></div>' + windows[wID].caption;
	document.getElementById("appholder").appendChild(newItem);

	sortWindowsZIndex(wID); //Sort the windows here to change the active window CSS

	if (info.init) { windows[wID].init = info.init; windows[wID].init(); }

	return wID; //might be useful
}

function newEditorWindow() {
	if (haveWindow.editor) { return; } //Probably should move the actual window into focus.
	//Need to make sure there is only one of these at a time!
	var editorMarkup = '<div class="winnav"><input type="button" value="Preset" id="navPreset" /><input type="button" value="Edit" id="navEdit" /><input type="button" value="Settings" id="navSettings" /><div class="winnavSpacer"></div><input type="button" value="Help" id="navHelp" /></div>' +
				'<div id="treeEffectHost"><div id="editorTreeHost"><div id="editorTreeButtons"><input style="float:right" type="button" value="&nbsp;-&nbsp;" onclick="removeSelected()" />' +
				'<input type="button" value="&nbsp;+&nbsp;" onclick="showMenu(event, 2);" />' +
				'<input type="button" value="x2" onclick="duplicatedSelected()" /></div>' +
				'<div id="editorTree"><div id="treeSelectedBG"></div><ul></ul></div></div>' +
				'<div id="treeEffectGrip" class="resizeGrip"></div>' +
				'<div id="effectHost"><fieldset><legend id="effectTitle">No effect/setting selected</legend><div id="effectContainer"></div></fieldset></div>' +
				'</div><div id="editorStatusbar">60.0 FPS @ 640x480 - Preset Name</div>';
	var wID = newWindow({"caption": "WebVS Editor", "icon": "icon.png", "width": 640, "height": 480, "minwidth": 320, "resizeable": true, "form": editorMarkup, "init": buildEditorTree, "close": function(){haveWindow.editor=false}});

	buildEffectMenu();

	eventHook(document.getElementById('editorTree'), 'scroll', moveSelectedBG);

	//We need to attach some listeners to the nav bar buttons.
	var menuBar = document.getElementById('f' + wID).childNodes[0].childNodes;
	for (var i = 0; i < menuBar.length; i++) {
		if (menuBar[i].tagName == "INPUT") {
			eventHook(menuBar[i], "click", showEditorNavMenu);
			eventHook(menuBar[i], "mouseover", showEditorNavMenu);
		}
	}

	haveWindow.editor = true;
}

function newWebVSWindow() { //Doesn't support resolution changing right now -- need to make it call webvs.resetCanvas()
	if (!haveWebVS || haveWindow.webvs) { return; }
	newWindow({"caption": "WebVS", "icon": "icon.png", "width": 640, "height": 480, "disableMaximise": true, "form": '<canvas style="background-color:#000;" width="640" height="480" id="webvsCanvas"></canvas>', "init": startWebVS, "close": stopWebVS});
	haveWindow.webvs = true;
}

function newExpressionHelpWindow(effect) {
	if (haveWindow.expression) { return; }

	//Work out which tab we're on
	if (effect && effectInfo[effect] && effectInfo[effect].help) { selectedHelpTab = effect; }
	if (!expressionHelp[selectedHelpTab] && selectedHelpTab != effect) { selectedHelpTab = 'General'; }

	//Build the form
	var markUp = '<div style="padding:10px"><div class="tabContainer">';
	for (var i in expressionHelp) {
		markUp += '<div id="tab' + i + '" class="tab' + (selectedHelpTab == i ? ' activeTab' : '') + '" onclick="changeHelpTab(\'' + i + '\')">' + i + '</div>';
	}
	if (effect && effectInfo[effect] && effectInfo[effect].help) {
		markUp += '<div id="tab' + effect + '" class="tab' + (selectedHelpTab == effect ? ' activeTab' : '') + '" onclick="changeHelpTab(\'' + effect + '\')">' + effectInfo[effect].name + '</div>';
	}

	markUp += '</div><textarea readonly id="expressionTextarea">';

	if (expressionHelp[selectedHelpTab]) {
		markUp += lameHTMLSpecialChars(expressionHelp[selectedHelpTab]);
	} else {
		markUp += lameHTMLSpecialChars(effectInfo[effect].help);
	}

	markUp += '</textarea><input type="button" style="margin-left:0;" onclick="closeWindow(event, event.target.parentNode.parentNode.id.substr(1))" value="Close" /></div>';

	newWindow({"caption": "WebVS Expression Help", "icon": "icon.png", "width": 467, "height": 375, "disableMaximise": true, "form": markUp, "close": function(){haveWindow.expression=false}});

	haveWindow.expression = true;
}

function startWebVS() {
	if (!haveWebVS) { return; }

	dancer = new Dancer();
	webvs = new Webvs.Main({
		canvas: document.getElementById("webvsCanvas"),
		analyser: new Webvs.DancerAdapter(dancer),
		showStat: false
	});

	webvs.loadPreset(preset);
	webvs.start();

	dancer.load({
		src: 'silence.ogg'
	});
	dancer.play();

	webVSActive = true;
}
function stopWebVS() {
	if (!haveWebVS) { return; }

	webvs.stop();
	dancer.pause();

	webVSActive = false;

	haveWindow.webvs = false;
}
function updateWebVSPreset() {
	if (!haveWebVS || !webVSActive) { return; }

	webvs.loadPreset(preset);
	webvs.start();
}

function changeHelpTab(page) {
	document.getElementById('tab' + selectedHelpTab).setAttribute('class', 'tab');
	if (!expressionHelp[page] && (!effectInfo[page] || !effectInfo[page].help)) {
		selectedHelpTab = 'General';
	} else {
		selectedHelpTab = page;
	}
	document.getElementById('tab' + selectedHelpTab).setAttribute('class', 'tab activeTab');
	if (expressionHelp[selectedHelpTab]) {
		document.getElementById('expressionTextarea').value = expressionHelp[selectedHelpTab];
	} else {
		document.getElementById('expressionTextarea').value = effectInfo[selectedHelpTab].help;
	}
	document.getElementById('expressionTextarea').scrollTop = 0;
}

function showMenu(e, markup, left, top, right, bottom) {
	if (!e) var e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();

	if (!markup) { return; }
	if (typeof markup == "number" && globalMenus[markup]) {
		markup = globalMenus[markup];
	} else if (typeof markup != "string" && markup.innerHTML) { //Remove this option
		markup = markup.innerHTML;
	} else if (markup.substr(0, 1) == '#') {
		markup = document.getElementById(markup.substr(1)).innerHTML;
	}
	gMenu.innerHTML = markup;

	if (!right) {
		gMenu.style.left = (left ? left : e.pageX + 2 + "px");
		gMenu.style.right = '';
	} else {
		gMenu.style.right = right;
		gMenu.style.left = '';
	}
	if (!bottom) {
		gMenu.style.top = (top ? top : e.pageY + 2 + "px");
		gMenu.style.bottom = '';
	} else {
		gMenu.style.bottom = bottom;
		gMenu.style.top = '';
	}

	gMenu.style.display = 'block';

	//This keeps the menu on the screen, children will still go off the edge.
	if (gMenu.offsetLeft + gMenu.offsetWidth > area.offsetWidth - 2) {
		gMenu.style.left = area.offsetWidth - gMenu.offsetWidth - 2 + "px";
	}
	//Hmm, this will lead to nav menus being places over their button
	/*if (gMenu.offsetTop + gMenu.offsetHeight > area.offsetHeight - 5) {
		gMenu.style.top = gMenu.offsetTop - gMenu.offsetHeight + "px";
	}*/
	addSubMenuPostionFix(gMenu.childNodes[0]);
}

function addSubMenuPostionFix(node) {
	for (var i = 0; i < node.childNodes.length; i++) {
		if (node.childNodes[i].childNodes[1] && node.childNodes[i].childNodes[1].tagName == 'UL') {
			eventHook(node.childNodes[i], "mouseover", positionSubMenu);
			addSubMenuPostionFix(node.childNodes[i].childNodes[1]);
		}
	}
}

function positionSubMenu(e) {
	//Check if this is the UL and not a LI
	//Is this menu going off the screen or is it going to overlap its parent?
	var ele = e.target.tagName == "UL" ? e.target : e.target.childNodes[1] && e.target.childNodes[1].tagName == "UL" ? e.target.childNodes[1] : null;
	if (!ele) { return; }
	eventHook(ele, "mouseover", positionSubMenu, true);

	//Climb the tree to for the global parent, so we can work out the menu's position from it.
	var tmpLeft = ele.offsetLeft + ele.offsetWidth;
	//var tmpTop = ele.offsetTop + ele.offsetHeight;
	var tmpEl = ele.offsetParent;
	var hasMargin = false;
	while (tmpEl != gMenu.parentNode) {
		if (tmpEl.tagName == 'UL' && tmpEl.style.margin) { hasMargin = true; break; }
		tmpLeft += tmpEl.offsetLeft;
		//tmpTop += tmpEl.offsetTop;
		tmpEl = tmpEl.offsetParent;
	}
	if (hasMargin || tmpLeft > area.offsetWidth - 2) {
		ele.style.marginLeft = -ele.parentNode.offsetWidth - ele.offsetWidth + "px";
	}
	/*if (tmpTop > area.offsetHeight - 5) {
		ele.style.marginTop = area.offsetHeight - tmpTop - 5 + "px";
	}*/
}

function hideMenu() {
	gMenu.style.display = 'none';

	editorMenuActive = false;
	if (editorMenuActiveElement) {
		editorMenuActiveElement.setAttribute('class', '');
		editorMenuActiveElement = null;
	}
}

function showEditorNavMenu(e) {
	//Check we're getting the correct events and that this function should be firing for them
	if (e.type != "click" && e.type != "mouseover") { return; }
	if (e.type == "mouseover" && !editorMenuActive) { return; }

	//Check we have a valid nav menu button and associated menu
	var targetId = e.target && e.target.id ? e.target.id : null;
	if (!navGlobalPos[targetId]) { return; }

	editorMenuActive = true;

	if (editorMenuActiveElement) { editorMenuActiveElement.setAttribute('class', ''); }
	editorMenuActiveElement = e.target;
	editorMenuActiveElement.setAttribute('class', 'navActive');

	//Calculate where to show the menu
	var tmpLeft = e.target.offsetLeft;
	var tmpTop = e.target.offsetTop + e.target.offsetHeight + 1;
	var tmpEl = e.target.offsetParent;
	while (tmpEl != null) {
		tmpLeft += tmpEl.offsetLeft;
		tmpTop += tmpEl.offsetTop;
		tmpEl = tmpEl.offsetParent;
	}

	showMenu(e, navGlobalPos[targetId], tmpLeft + "px", tmpTop + "px");
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

	document.getElementById('editorTree').childNodes[1].innerHTML = ''; //Clear the tree

	var newEffect = document.createElement('li');
	newEffect.innerHTML = 'Main';
	newEffect.id = "ET-Main";
	eventHook(newEffect, 'click', displayEffectView);
	document.getElementById('editorTree').childNodes[1].appendChild(newEffect);

	recursiveTreePopulate(preset.components, document.getElementById('editorTree').childNodes[1], 'ET');

	if (selectedEffect && typeof selectedEffect == "string") {
		selectedEffect = document.getElementById(selectedEffect);
		selectedEffect.setAttribute('class', (selectedEffect.getAttribute('class') && selectedEffect.getAttribute('class').indexOf('effectTree') != -1 ? 'effectTree ' : '') + 'selectedEffect');
	}
}

function recursiveTreePopulate(branch, parent, id) {
	for (i in branch) {
		//console.log(i, branch[i]);
		var newEffect = document.createElement('li');
		newEffect.id = id + '-' + i;
		var treeName = '';
		if (typeof effectInfo[branch[i].type] != 'undefined') {
			treeName = (effectInfo[branch[i].type].type != "" ? effectInfo[branch[i].type].type + ' / ' : '') + effectInfo[branch[i].type].name;
		} else {
			treeName = effectInfo.unknown.name + ' (' + branch[i].type + ')';
		}
		if (branch[i].type == 'EffectList') {
			newEffect.innerHTML = '<span ' + (branch[i].collapsed ? 'class="collapsed" ' : '') + 'onclick="toggleCollapseList(event)"></span>' + lameHTMLSpecialChars(treeName);
		} else {
			newEffect.innerHTML = lameHTMLSpecialChars(treeName);
		}
		eventHook(newEffect, 'click', displayEffectView);
		parent.appendChild(newEffect);

		if (branch[i].type == 'EffectList') {
			var newList = document.createElement('ul');
			newEffect.appendChild(newList);
			recursiveTreePopulate(branch[i].components, newList, id + '-' + i);
			newEffect.setAttribute('class', 'effectTree');
		}
	}
}

function displayEffectView(e) {
	if (!e) var e = window.event;
	e.cancelBubble = true;
	if (e.stopPropagation) e.stopPropagation();

	//We'd need to walk the tree to figure out where this element is and compare with layerY
	//If it's below the Effect List element, then we could fire a click event on the correct child element
	//   doing that would give us the benefit of the div/padding based list with less silly css
	if (e.target.getAttribute('class') && e.target.getAttribute('class').indexOf('effectTree') != -1) {
		//We need to walk up, to work out where this effects list starts
		//Then, if we have more then 20 pixels left over, walk down this effect list (recursively) to find the correct child and click it.
		var tmpTop = e.target.offsetTop;
		var tmpEl = e.target.offsetParent;
		while (tmpEl != document.getElementById('editorTree')) {
			tmpTop += tmpEl.offsetTop;
			tmpEl = tmpEl.offsetParent;
		}
		var adjustedLayerY = e.layerY - tmpTop - 20;

		if (adjustedLayerY > 0) {
			tmpEl = e.target.childNodes[2]; //Start at the 3rd child - avoids the collapse span + "Effect list" text
			for (var i = 0; i < tmpEl.childNodes.length; i++) {
				if (adjustedLayerY - tmpEl.childNodes[i].offsetHeight < 1) {
					if (tmpEl.childNodes[i].childNodes && adjustedLayerY > 20) {
						//be recursive - Yes this is a crappy way of achieving it.
						adjustedLayerY -= 20;
						tmpEl = tmpEl.childNodes[i].childNodes[2];
						i = -1;
						continue;
					} else {
						//send click
						var evt = document.createEvent("MouseEvents");
						evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
						tmpEl.childNodes[i].dispatchEvent(evt);
						return;
					}
					break;
				} else {
					adjustedLayerY -= tmpEl.childNodes[i].offsetHeight;
				}
			}
		}
	}

	if (selectedEffect) { //remove selected state from the current element
		if (selectedEffect == e.target) { return; } //No point building the pane again in this case.
		selectedEffect.setAttribute('class', selectedEffect.getAttribute('class') && selectedEffect.getAttribute('class').indexOf('effectTree') != -1 ? 'effectTree' : '');
	}

	selectedEffect = e.target.tagName == 'SPAN' ? e.target.parentNode : e.target; //add the selected state to the chosen element
	selectedEffect.setAttribute('class', (selectedEffect.getAttribute('class') && selectedEffect.getAttribute('class').indexOf('effectTree') != -1 ? 'effectTree ' : '') + 'selectedEffect');

	//Move the selected BG element to the correct location
	var tmpTop = selectedEffect.offsetTop;
	var tmpEl = selectedEffect.offsetParent;
	while (tmpEl != document.getElementById('editorTree')) {
		tmpTop += tmpEl.offsetTop;
		tmpEl = tmpEl.offsetParent;
	}
	document.getElementById('editorTree').childNodes[0].style.display = "block";
	document.getElementById('editorTree').childNodes[0].style.top = tmpTop + "px";

	//Walk the tree to our selected effect, then build its pane
	var treePos = selectedEffect.id.substr(3).split("-");
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
			thisEffectHTML = '<textarea id="text" class="commentTextarea" onchange="updatePreset(event)">' + theComment + '</textarea>';
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
}

function moveSelectedBG() {
	//This function is basically a hack because my brain is unable to figure out the CSS way to make the selected BG always cover tree width.
	document.getElementById('editorTree').childNodes[0].style.left = document.getElementById('editorTree').scrollLeft + "px";
}

function toggleCollapseList(e) {
	if (!e.target || !e.target.parentNode || !e.target.parentNode.childNodes[2]) { return; }

	//Find & mark the effect list in the preset with the collapsed status
	var treePos = e.target.parentNode.id.substr(3).split('-');
	var node = preset.components[treePos[0]];
	if (treePos.length > 1) {
		for (var i = 1; i < treePos.length; i++) {
			node = node.components[treePos[i]];
		}
	}

	if (node.collapsed) {
		delete node.collapsed;
	} else {
		node.collapsed = true;
	}
	e.target.setAttribute('class', node.collapsed ? 'collapsed' : '');
}

function buildPaneElement(typeInfo, data, name, parent) {
	if (typeof data == 'undefined' || typeof typeInfo.control == 'undefined') { return ''; }
	var thisID = (parent != '' ? parent + '-' : '') + name;
	var output = '<div class="paneElementHost">'
	if (typeInfo.label) {	output += "<div" + (typeInfo.control != control_code ? ' style="display:inline;margin-right:5px;" ' : '') + ">" + lameHTMLSpecialChars(typeInfo.label) + "</div>"; }
	switch (typeInfo.control) {
		case control_null:
			//
			break;
		case control_code:
			output += '<div class="popOutLink" onclick="popOutThis(event);">\u2197</div><textarea id="' + thisID + '" style="width:100%;height:' + (typeInfo.height ? typeInfo.height : '50') + 'px;resize:vertical;" spellcheck="false" onchange="updatePreset(event)">' + data + '</textarea>';
			break;
		case control_text:
			output += '<input id="' + thisID + '" type="text" onchange="updatePreset(event)" value="' + data + '"/>';
			break;
		case control_number:
			output += '<input id="' + thisID + '" type="number"' + (typeInfo.min ? ' min="' + typeInfo.min + '"' : '') + ' ' + (typeInfo.max ? ' max="' + typeInfo.max + '"' : '') + ' onchange="updatePreset(event)" value="' + (parseInt(data) == data ? data : typeInfo.default) + '"/>';
			break;
		case control_radio:
			if (!data || !typeInfo.options[data]) { data = typeInfo.default; }
			for (var o in typeInfo.options) {
				output += (typeInfo.newLine ? '<br />' : '') + '<label><input type="radio" name="' + thisID + '" id="' + thisID + '"' + (o == data ? ' checked' : '') + ' value="' + o + '" onchange="updatePreset(event)" />' + typeInfo.options[o] + '</label>' + (typeInfo.newLine ? '' : ' ');
			}
			break;
		case control_check:
			output += '<input type="checkbox" id="' + thisID + '"' + ((typeof data != "boolean" && typeInfo.default) || data ? ' checked' : '') + ' onchange="updatePreset(event)" />';
			break;
		case control_colour:
			output += '<input type="color" id="' + thisID + '" value="' + (data ? data : typeInfo.default) + '" />';
			break;
		case control_colour_bar:
			output += name + ': ' + JSON.stringify(typeInfo) + (data ? ', ' + data : '');
			break;
		case control_button:
			output += '<input type="button" onclick="' + typeInfo.onclick + '" value="' + typeInfo.value + '" />';
			break;
		case control_dropdown:
			output += '<select name="' + thisID + '" id="' + thisID + '" onchange="updatePreset(event)">';
			if (typeInfo.options == "IMAGES") {
				if (avsres) {
					for (var o in avsres) {
						output += '<option value="' + o + '"' + (o == data ? ' selected': '') + '>' + o + '</option>';
					}
				} else {
					output += '<option selected disabled>No images avaliable</option>';
				}
			} else {
				for (var o in typeInfo.options) {
					output += '<option value="' + o + '"' + (o == data ? ' selected': '') + '>' + typeInfo.options[o] + '</option>';
				}
			}
			output += '</select>';
			break;
		case control_slider:
			output += '<input type="range" min="0" max="1" step="0.025" value="' + (data ? data : typeInfo.default) + '" />';
			break;
		case control_label:
			//break;
		default:
			output += name + ': ' + JSON.stringify(typeInfo) + (data ? ', ' + data : '');
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
		var effectData = node[effectID[0]] ? node[effectID[0]][effectID[1]] : '';
	} else {
		var effectElement = effectInfo[node.type].pane[effectID];
		var effectData = node[effectID];
	}
	//wrap="off"
	var popoutMarkup = '<div class="popoutHost"><textarea class="popoutElement" id="' + popID + '" onchange="updatePreset(event)" spellcheck="false">' + (effectData ? effectData : '') + '</textarea><div class="popoutStatusBar" onclick="selectFromPopout(event)" title="Click to select this effect in the editor">' + treeTrail + '</div></div>';
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

	updateWebVSPreset();
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

	updateWebVSPreset();
}

function updatePreset(e) {
	if (e.target.type && e.target.type == "checkbox") {
		var newValue = e.target.checked;
	} else if (e.target.type && e.target.tagName == "SELECT") {
		var newValue = e.target.options[e.target.selectedIndex].value;
	} else {
		var newValue = e.target.value;
	}

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
		if (effect.indexOf('-') != -1) {
			effect = effect.split('-');
			if (!node[effect[0]]) { node[effect[0]] = []; }
			node[effect[0]][effect[1]] = newValue;
		} else {
			node[effect] = newValue;
		}
	}

	updateWebVSPreset();
}

function addThisEffect(e) {
	//If the tree has no selected elements, then it inserted after the Main node
	//If the selected element is an effects list then the effect is insert as the first child in that list
	//Otherwise it is inserted before the selected effect
	if (!e.target.id || e.target.id.substr(0, 5) != 'menu-') { return; }

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

	updateWebVSPreset();
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
	globalMenus[2] = '<ul>' + markup + '</ul>';
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

			//need a check here to confirm if the editor exists, if it does then:
			//buildEditorTree();

			updateWebVSPreset();
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
	gMenu = document.getElementById("globalMenu");
	eventHook(document, "mousemove", mousemove);
	eventHook(document, "mousedown", mousedown);
	eventHook(document, "mouseup", mouseup);
	eventHook(window, "resize", handleWindowResize);
	eventHook(document, "keypress", keypress);
	//eventHook(document, "mouseover", areaVis);
	//eventHook(document, "mouseout", areaVis);
	eventHook(document, "drop", dropHandler);
	eventHook(document, "dragover", dndCancel);
	eventHook(document, "dragenter", dndCancel);
	setInterval(setTrayClock, 1000); setTrayClock(); //This needs improving. We can get the update tick in sync, copy what was done for offline planner

	fetchPreset();

	newEditorWindow();

	haveWebVS = typeof Dancer != 'undefined' && typeof Webvs != 'undefined' ? true : false;
	haveWebVS = false;
	if (haveWebVS) { newWebVSWindow(); }

	//We need some way of registering windows onload, that'll let us add them to menus and stuff if they want to be placed on one.
}

eventHook(window, "load", init);