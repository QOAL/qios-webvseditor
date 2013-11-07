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
var control_kernel = 0xB;

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
			"source": { label: "Source data:", control: control_radio, "options": {"WAVEFORM": "Waveform", "SPECTRUM": "Spectrum"}, "default": "SPECTRUM" },
			"audioChannel": { label: "Channel:", control: control_radio, "options": {"LEFT": "Left", "CENTER": "Centre", "RIGHT": "Right"}, "default": "CENTER" },
			"drawMode": { label: "Draw as:", control: control_radio, "options": {"DOTS": "Dots", "LINES": "Lines"}, "default": "LINES"},
			"colour": {
				"count": { label: "Cycle through", control: control_number, "min": 1, "max": 16, "default": 1 },
				"list": { label: "Colours (Max 16)", control: control_colour_bar}
			},
			"help": { control: control_button, "value": "Expression Help", "onclick": "newExpressionHelpWindow('SuperScope');" }
		},
		"stub": {
			"type": "SuperScope",
			"code": { "init": "n=800", "perFrame": "t=t-0.05", "onBeat": "", "perPoint": "d=i+v*0.2; r=t+i*$PI*4; x=cos(r)*d; y=sin(r)*d" },
			"source": "SPECTRUM",
			"audioChannel": "CENTER",
			"drawMode": "LINES",
			"colors": ["#ffffff", "#ff0000"]
		},
		"help": ["Superscope tutorial goes here",
			"But for now, here is the old text:",
			"You can specify expressions that run on Init, Frame, and on Beat.",
			"  'n' specifies the number of points to render (set this in Init, Beat, or Frame).",
			"For the 'Per Point' expression (which happens 'n' times per frame), use:",
			"  'x' and 'y' are the coordinates to draw to (-1..1)",
			"  'i' is the position of the scope (0..1)",
			"  'v' is the value at that point (-1..1).",
			"  'b' is 1 if beat, 0 if not.",
			"  'red', 'green' and 'blue' are all (0..1) and can be modified",
			"  'linesize' can be set from 1.0 to 255.0",
			"  'skip' can be set to >0 to skip drawing the current item",
			"  'drawmode' can be set to > 0 for lines, <= 0 for points",
			"  'w' and 'h' are the width and height of the screen, in pixels.",
			" Anybody want to send me better text to put here? Please :)"].join("\n")
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
			"coordinates": { label: "Coordinates system:", control: control_radio, "options": {"POLAR": "Polar", "RECT": "Rectangular"}, "default": "POLAR" },
			"help": { control: control_button, "value": "Expression Help", "onclick": "newExpressionHelpWindow('DynamicMovement');" }
		},
		"help": "Dynamic movement help goes here (send me some :)"
	},
	"Blur": {
		"name": "Blur",
		"type": "Trans",
		"pane": {
			"blur": { label: "Strength:", control: control_radio, "options": {"NONE": "None", "LIGHT": "Light", "MEDIUM": "Medium", "HEAVY": "Heavy"}, "default": "MEDIUM", "newLine": true},
			"rounding": { label: "Rounding:", control: control_radio, "options": {"DOWN": "Down", "UP": "Up"}, "default": "DOWN", "newLine": true}
		}
	},
	"ColorClip": {
		"name": "Colour Clip",
		"type": "Trans",
		"pane": {
			"mode": { control: control_radio, "options": {"OFF": "Off", "BELOW": "Below", "ABOVE": "Above", "NEAR": "Near"}, "default": "BELOW" },
			"level": { label: "Near clip level:", control: control_slider, "default": .2 },
			"color": { label: "Colour:", control: control_colour, "default": "#202020" },
			/*"button": { control: control_button, "value": "Copy to Out Colour" },*/
			"outColor": { label: "Out Colour:", control: control_colour, "default": "#202020" }
		}
	},
	"Picture": {
		"name": "Picture",
		"type": "Render",
		"pane": {
			"enabled": { label: "Enabled:", control: control_check, "default": true },
			"src": { control: control_dropdown, "options": "IMAGES"},
			"blendMode": { label: "Blend mode:", control: control_radio, "options": {"REPLACE": "Replace", "ADDITIVE": "Additive blend", "5050": "Blend 50/50", "5050OBA": "Blend 50/50 + OnBeat Additive"}, "default": "5050", "newLine": true }
		}
	},
	"Convolution": {
		"name": "Convolution Filter",
		"type": "Trans",
		"pane": {
			"enabled": { label: "Enabled:", control: control_check, "default": true },
			"kernel": { label: "Filter data:", control: control_kernel },
			"bias": { label: "Bias:", control: control_number, "default": 0 },
			"scaling": { label: "Scaling:", control: control_number, "default": 0 },
			"edgeMode": { label: "Viewport edge handling:", control: control_radio, "options": {"WRAP": "Wrap", "EXTEND": "Extend"}, "default": "EXTEND" },
			"absolute": { label: "Absolute:", control: control_check, "default": false },
			"twoPass": { label: "2-Pass:", control: control_check, "default": false }
		}
	}
};

var expressionHelp = {
	"General": ["Many AVS effects allow you to write simple expressions to control",
			"visualization. Here is a brief summary of how to write AVS code.\n",
			"Many aspects of AVS code are similar to C (including comments). ",
			"You can create new variables just by using them, and you can read",
			"and write predefined variables (of which each effect has its own)",
			"to interact with the effect. Note that variables are all floating",
			"point numbers (no strings), and the maximum length of a variable's",
			"name is 8 characters (anything longer will be ignored.",
			"So, to create a variable, you can simply use it, for example:",
			"  x = 5;\n",
			"You can also use a variety of operators and math functions to",
			"modify variables, see the Operators and Functions tabs above.\n",
			"Code can include C and C++ style comments:",
			"  // using the double slash comments until the end of the line",
			"  /* using the classic C comments ",
			"     comment a block of text */\n",
			"You can combine operators and functions into expressions, such as:",
			"  x = 5 * cos(y) / 32.0; // this does some leetness right here\n",
			"You can use multiple expressions by separating them with one or",
			"more semicolons, for example:",
			"  x = x * 17.0; x = x / 5; y = pow(x,3.0);\n",
			"It is worth noting that extra white space (spaces, newlines) is",
			"ignored, so if you need to space things out for clarity, you can.\n"].join('\n'),
	"Operators": ["The following operators are available:",
			"=",
			"  assigns a value to a variable.",
			"  example:  var=5;\n",
			"+",
			"  adds two values, returns the sum.",
			"  example:  var=5+var2;\n",
			"-",
			"  subtracts two values, returns the difference.",
			"  example:  var=5-var2;\n",
			"*",
			"  multiplies two values, returns the product.",
			"  example:  var=5*var2;\n",
			"/",
			"  divides two values, returns the quotient.",
			"  example:  var=5/var2;\n",
			"%",
			"  converts two values to integer, performs division, returns remainder",
			"  example:  var=var2%5;\n",
			"|",
			"  converts two values to integer, returns bitwise OR of both values",
			"  example:  var=var2|31;\n",
			"&",
			"  converts two values to integer, returns bitwise AND of both values",
			"  example:  var=var2&31;\n\n"].join('\n'),
	"Functions": ["Functions available from code:",
			"abs(value)",
			"  = returns the absolute value of 'value'\n",
			"sin(value)",
			"  = returns the sine of the radian angle 'value'\n",
			"cos(value)",
			"  = returns the cosine of the radian angle 'value'\n",
			"tan(value)",
			"  = returns the tangent of the radian angle 'value'\n",
			"asin(value)",
			"  = returns the arcsine (in radians) of 'value'\n",
			"acos(value)",
			"  = returns the arccosine (in radians) of 'value'\n",
			"atan(value)",
			"  = returns the arctangent (in radians) of 'value'\n",
			"atan2(value,value2)",
			"  = returns the arctangent (in radians) of 'value'/'value2'\n",
			"sqr(value)",
			"  = returns the square of 'value'\n",
			"sqrt(value)",
			"  = returns the square root of 'value'\n",
			"invsqrt(value)",
			"  = returns the reciprocal of the  square root of 'value' (1/sqrt(value))",
			"    (uses a fast approximation, may not always = 1/sqrt(value) :)\n",
			"pow(value,value2)",
			"  = returns 'value' to the power of 'value2'\n",
			"exp(value)",
			"  = returns e to the power of 'value'\n",
			"log(value)",
			"  = returns the log in base e of 'value'\n",
			"log10(value)",
			"  = returns the log in base 10 of 'value'\n",
			"floor(value)",
			"  = returns the largest integer less than or equal to 'value'\n",
			"ceil(value)",
			"  = returns the smallest integer greater than or equal to 'value'\n",
			"sign(value)",
			"  = returns the sign of 'value' (-1.0 or 1.0, or 0.0 or -0.0 for 0.0 or -0.0)\n",
			"min(value,value2)",
			"  = returns the smallest of 'value' and 'value2'\n",
			"max(var,var2)",
			"  = returns the greatest of 'value' and 'value2'\n",
			"sigmoid(value,value2)",
			"  = returns sigmoid function value of x='value' ('value2'=constraint)\n",
			"rand(value)",
			"  = returns a random integer between 0 and 'value'\n",
			"band(value,value2)",
			"  = returns a boolean AND of 'value' and 'value2'\n",
			"bor(value,value2)",
			"  = returns a boolean OR of 'value' and 'value2'\n",
			"bnot(value)",
			"  = returns a boolean NOT of 'value'\n",
			"if(condition,valtrue,valfalse)",
			"  = returns 'valtrue' if 'condition' is nonzero, returns 'valfalse' otherwise.",
			"    new in AVS 2.8+: only one of valtrue/valfalse is evaluated, depending on condition\n",
			"assign(dest, source)",
			"  = if 'dest' is a variable, assigns the value of 'source' to it. returns the value of 'source'.",
			"    a little trick: assign(if(v,a,b),1.0); is like if V is true, a=1.0, otherwise b=1.0. :)\n",
			"exec2(parm1, parm2)",
			"  = evaluates parm1, then parm2, and returns the value of parm2.\n",
			"equal(value,value2)",
			"  = returns 1.0 if 'value' is equal to 'value2', otherwise returns 0.0\n",
			"above(value,value2)",
			"  = returns 1.0 if 'value' is greater than 'value2', otherwise returns 0.0\n",
			"below(value,value2)",
			"  = returns 1.0 if 'value' is less than 'value2', otherwise returns 0.0\n",
			"getosc(band,width,channel)",
			"  = returns waveform data centered at 'band', (0..1), sampled 'width' (0..1) wide.",
			"    'channel' can be: 0=center, 1=left, 2=right. return value is (-1..1)\n",
			"getspec(band,width,channel)",
			"  = returns spectrum data centered at 'band', (0..1), sampled 'width' (0..1) wide.",
			"    'channel' can be: 0=center, 1=left, 2=right. return value is (0..1)\n",
			"gettime(start_time)",
			"  = returns time in seconds since start_time (start_time can be 0 for time since boot)",
			"    (start_time can be -1.0 for current play time in seconds",
			"    (start_time can be -2.0 for current play length in seconds\n",
			"getkbmouse(which_parm)",
			"  = returns information about the location and state of the keyboard or mouse",
			"    which_parm = 1: mouse X position (-1..1 is onscreen)",
			"    which_parm = 2: mouse Y position (-1..1 is onscreen)",
			"    which_parm = 3: mouse left button state (0 up, 1 down)",
			"    which_parm = 4: mouse right button state (0 up, 1 down)",
			"    which_parm = 5: mouse middle button state (0 up, 1 down)",
			"    which_parm > 5: (GetAsyncKeyState(which_parm)&0x8000)?1:0\n",
			"megabuf(index)",
			"  = can be used to get or set an item from the 1 million item temp buffer",
			"    to get, use:   val=megabuf(index);",
			"    to set, use:   assign(megabuf(index),val);",
			"gmegabuf(index)",
			"  = can be used to get or set an item from the global 1 million item buffer",
			"    to get, use:   val=gmegabuf(index);",
			"    to set, use:   assign(gmegabuf(index),val);\n",
			"loop(count, statement)",
			"  = executes <statement> <count> times. count is evaluated once and clamped",
			"    to 0..4096. best used with exec2() and exec3() and assign(). Note that",
			"    the return value of loop() is undefined and should not be used.\n\n"].join('\n'),
	"Constants": ["Constants",
			"   '$PI' can be used in place of '3.14159'",
			"   '$E' can be used in place of '2.71828'",
			"   '$PHI' can be used in place of '1.618033'",
			"   Numbers can be specified as integers or as floating point",
			"     (i.e. '5' or '5.0' or '5.00001')\n"].join('\n')
};