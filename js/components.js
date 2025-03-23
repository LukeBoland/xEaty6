/*
Classes
*/

class Bus
{
	constructor(line0, line1, line2, line3, line4, line5, line6, line7, header, clockLocation)
	{
		this.line = [];
		this.line[0] = line0;
		this.line[1] = line1;
		this.line[2] = line2;
		this.line[3] = line3;
		this.line[4] = line4;
		this.line[5] = line5;
		this.line[6] = line6;
		this.line[7] = line7;
		this.header = header;
		this.setValue(0);
		this.clock = new Clock($(clockLocation));
	}
	
	setValue(val)
	{
		if(val > 255 || val < 0 || !Number.isInteger(val))
		{
			if(val > 255)
				alert("BUS || 8-bit error: numbers larger than 255 do not exist, " + val + " encountered");
			if(val < 0)
				alert("BUS || 8-bit error: numbers larger than 255 do not exist, " + val + " encountered");
			if(!Number.isInteger(val))
				alert("BUS || Bus can only take integer values, " + val + " encountered");
		}
		else
		{
			this.bus_value = val;
			this.calculateBusLine();
		}
		return this.bus_value;
	}
	
	calculateBusLine()
	{
		let val = (this.bus_value >>> 0).toString(2).padStart(8, "0");
		this.bus_line = val.split("");
		this.showBusLine();
	}
	
	showBusLine()
	{
		for(let i=0; i < 8; i++)
		{
			if(this.bus_line[i] == 1)
			{
				$(this.line[i]).addClass("bus_line_on");
				$(this.line[i]).removeClass("bus_line_off");
			}
			else
			{
				$(this.line[i]).addClass("bus_line_off");
				$(this.line[i]).removeClass("bus_line_on");
			}
		}
		$(this.header)[0].textContent = this.valString();
	}
	
	valString()
	{
		return this.bus_value + " - 0x" + (this.bus_value >>> 0).toString(16) + " - 0b" + (this.bus_value >>> 0).toString(2).padStart(8,"0");
	}
	
	getValue()
	{
		return this.bus_value;
	}
}

class Clock
{
	constructor(target, bus)
	{
		this.downstream = [];
		this.speed = 8; //Initalise at 8Hz
		this.clockdiv = CreateComponent('comp_clock');
		this.clockdiv.children(".componentheader")[0].textContent = "CLOCK MODULE";
		this.clockdiv.children(".componentheader").append($("<div class='led led_off' style='float: right; margin-top: -1px;' id='clockled'>&nbsp;</div>"));
		this.btn_switch = $("<label class='switch clockswitch'>Clock: <input type='checkbox' id='clockcontrol'><span class='slider round'></span></label>");
		this.clockdiv.children(".componentheader").append(this.btn_switch);
		this.clockdiv.children(".componentbody").append($("<div id='stepbutton'>Step</div>"));
		let speedDisp = $("<div><fieldset style='width: 220px'><legend>Speed (Hz)</legend</fieldset></div>");
		this.clockdiv.children(".componentbody").append($("<div><fieldset style='width: 137px;'><legend>Clock Counter</legend><h2 id='clockcount'>00000</h2><button id='countreset' style='margin-top: 10px;'>Reset Counter</button></fieldset></div>"));
		this.speedDispTens = new SevenSegmentDisplay(speedDisp.children("fieldset"));
		this.speedDispUnits = new SevenSegmentDisplay(speedDisp.children("fieldset"));
		speedDisp.children("fieldset").append($("<div style='display: inline-block; margin-left: 20px;' id='speedslider'></div>"));
		this.clockdiv.children(".componentbody").append(speedDisp);
		target.append(this.clockdiv);
		$("#clockcontrol").click(function(){
			if(this.checked)
				bus.Clock.clockStart();
			else
				bus.Clock.clockStop();
		});
		$("#stepbutton").mousedown(function(){
			bus.Clock.pulse(bus.Clock);
		});
		$("#stepbutton").mouseup(function(){
			bus.Clock.pulse(bus.Clock);
		});
		$("#countreset").click(function(){
			$("#clockcount")[0].textContent = "00000";
		});
		this.clockstatus = false;
		this.timer = false;
		this.setSpeed(this.speed);
		$(function() 
		{
			$( "#speedslider" ).slider({
				orientation: "vertical",
				range: "min",
				min: 1,
				max: 99,
				value: 8,
				step: 1,
				slide: function( event, ui ) {
					bus.Clock.setSpeed(ui.value);
				}
			  });
		});
		this.active = false;
	}
	
	clockStart()
	{
		console.log("Start clock");
		this.active = true;
		this.timer = setInterval(this.pulse, Math.floor(500/this.speed), this);
		$("#speedslider").css({"display": "none"});
		$("#countreset").css({"display": "none"});
	}
	
	clockStop()
	{
		console.log("Stop clock");
		this.active = false;
	}
	
	clockConnect(callback)
	{
		this.downstream.push(callback);
		console.log(this.downstream);
	}
	
	pulse(myParent)
	{
		myParent.clockstatus = !myParent.clockstatus;
		if (myParent.clockstatus)
		{
			$("#clockled").addClass("led_on");
			$("#clockled").removeClass("led_off");
		}
		else
		{
			$("#clockled").addClass("led_off");
			$("#clockled").removeClass("led_on");
			$("#clockcount")[0].textContent = (parseInt($("#clockcount")[0].textContent) + 1).toString().padStart(5,"0"); //It's only a completed pulse on the falling edge
			if(!myParent.active)
			{
				clearInterval(myParent.timer);
				$("#speedslider").css({"display": "inline-block"});
				$("#countreset").css({"display": "inline-block"});
			}
		}
		myParent.downstream.forEach(function (item) {
			item(myParent.clockstatus);
		});
		return true;
	}
	
	setSpeed(newSpeed)
	{
		this.speed = newSpeed;
		this.speedDispUnits.setValue(this.speed % 10);
		this.speedDispTens.setValue(Math.floor(this.speed / 10));
	}
	
	getSpeed()
	{
		return this.speed;
	}
}

class SevenSegmentDisplay
{
	constructor(target)
	{
		this.dispValue = false;
		this.control = $("<section class='sevensegment'><div class='one'></div><span class='two'></span><span class='three'></span><div class='four'></div><span class='five'></span><span class='six'></span><div class='seven'></div></section>");
		target.append(this.control);
	}

	clear()
	{
		this.control.children().css({"background-color": "white"});
	}

	setValue(val)
	{
		this.dispValue
		switch(val)
		{
			case 0:
				this.drawZero();
				this.dispValue = 0; //WHY LIKE THIS? So we don't accidentally set a bad value
				break;
			case 1:
				this.drawOne();
				this.dispValue = 1; //WHY LIKE THIS? So we don't accidentally set a bad value
				break;
			case 2:
				this.drawTwo();
				this.dispValue = 2; //WHY LIKE THIS? So we don't accidentally set a bad value
				break;
			case 3:
				this.drawThree();
				this.dispValue = 3; //WHY LIKE THIS? So we don't accidentally set a bad value
				break;
			case 4:
				this.drawFour();
				this.dispValue = 4; //WHY LIKE THIS? So we don't accidentally set a bad value
				break;
			case 5:
				this.drawFive();
				this.dispValue = 5; //WHY LIKE THIS? So we don't accidentally set a bad value
				break;
			case 6:
				this.drawSix();
				this.dispValue = 6; //WHY LIKE THIS? So we don't accidentally set a bad value
				break;
			case 7:
				this.drawSeven();
				this.dispValue = 7; //WHY LIKE THIS? So we don't accidentally set a bad value
				break;
			case 8:
				this.drawEight();
				this.dispValue = 8; //WHY LIKE THIS? So we don't accidentally set a bad value
				break;
			case 9:
				this.drawNine();
				this.dispValue = 9; //WHY LIKE THIS? So we don't accidentally set a bad value
				break;

			default:
				return false;
		}
		return true;
	}

	drawZero()
	{
		this.clear();
		this.control.children(".one").css({"background-color": "red"});
		this.control.children(".two").css({"background-color": "red"});
		this.control.children(".three").css({"background-color": "red"});
		this.control.children(".five").css({"background-color": "red"});
		this.control.children(".six").css({"background-color": "red"});
		this.control.children(".seven").css({"background-color": "red"});
	}

	drawOne()
	{
		this.clear();
		this.control.children(".three").css({"background-color": "red"});
		this.control.children(".six").css({"background-color": "red"});
	}

	drawTwo()
	{
		this.clear();
		this.control.children(".one").css({"background-color": "red"});
		this.control.children(".three").css({"background-color": "red"});
		this.control.children(".four").css({"background-color": "red"});
		this.control.children(".five").css({"background-color": "red"});
		this.control.children(".seven").css({"background-color": "red"});
	}

	drawThree()
	{
		this.clear();
		this.control.children(".one").css({"background-color": "red"});
		this.control.children(".three").css({"background-color": "red"});
		this.control.children(".four").css({"background-color": "red"});
		this.control.children(".six").css({"background-color": "red"});
		this.control.children(".seven").css({"background-color": "red"});
	}

	drawFour()
	{
		this.clear();
		this.control.children(".two").css({"background-color": "red"});
		this.control.children(".three").css({"background-color": "red"});
		this.control.children(".four").css({"background-color": "red"});
		this.control.children(".six").css({"background-color": "red"});
	}

	drawFive()
	{
		this.clear();
		this.control.children(".one").css({"background-color": "red"});
		this.control.children(".two").css({"background-color": "red"});
		this.control.children(".four").css({"background-color": "red"});
		this.control.children(".six").css({"background-color": "red"});
		this.control.children(".seven").css({"background-color": "red"});
	}

	drawSix()
	{
		this.clear();
		this.control.children(".one").css({"background-color": "red"});
		this.control.children(".two").css({"background-color": "red"});
		this.control.children(".four").css({"background-color": "red"});
		this.control.children(".five").css({"background-color": "red"});
		this.control.children(".six").css({"background-color": "red"});
		this.control.children(".seven").css({"background-color": "red"});
	}

	drawSeven()
	{
		this.clear();
		this.control.children(".one").css({"background-color": "red"});
		this.control.children(".three").css({"background-color": "red"});
		this.control.children(".six").css({"background-color": "red"});
	}

	drawEight()
	{
		this.control.children().css({"background-color": "red"});
	}

	drawNine()
	{
		this.clear();
		this.control.children(".one").css({"background-color": "red"});
		this.control.children(".two").css({"background-color": "red"});
		this.control.children(".three").css({"background-color": "red"});
		this.control.children(".four").css({"background-color": "red"});
		this.control.children(".six").css({"background-color": "red"});
	}
}

class Register
{
	constructor(target, regTitle, systembus)
	{
		this.component = CreateComponent("comp_register");
		this.regTitle = regTitle;
		this.storedVal = 0;
		this.ledLine = [];
		this.LEDS = [];
		this.systembus = systembus;
		this.component.children(".componentheader")[0].textContent = this.regTitle;
		for(let i=0; i<8; i++)
		{
			this.LEDS[i] = $("<div class='led led_off'>&nbsp;</div>");
			this.component.children(".componentbody").append(this.LEDS[i]);
		}
		let valDisp = $("<div style='grid-row: 1 / span 3; grid-column:9;'><fieldset style='width: 250px'><legend>Value</legend</fieldset></div><div class='rx_from_bus' style='grid-column:1 / span 3;'><div class='arrowed'><div class='arrow-r'></div></div>IN</div><div class='tx_to_bus' style='grid-column:1 / span 3;'><div class='arrowed'><div class='arrow-l'></div></div>OUT</div>");
		this.valDispHundreds = new SevenSegmentDisplay(valDisp.children("fieldset"));
		this.valDispTens = new SevenSegmentDisplay(valDisp.children("fieldset"));
		this.valDispUnits = new SevenSegmentDisplay(valDisp.children("fieldset"));
		this.component.children(".componentbody").append(valDisp);
		target.append(this.component);
		this.setValue(this.storedVal);
		this.mode = 0;
	}

	setMode(tmpmode)
	{
		switch(tmpmode)
		{
			case -1: // rx data from bus
				this.mode = -1;
				break;
			case 0: // disconnected from bus
				this.mode = 0;
				break;
			case 1: // tx data to bus
				this.mode = 1;
				break;
			default:
				return false;

		}
	}

	calculateLEDs()
	{
		let val = (this.storedVal >>> 0).toString(2).padStart(8, "0");
		this.ledLine = val.split("");
		this.showLEDLine();
	}
	
	showLEDLine()
	{
		for(let i=0; i < 8; i++)
		{
			if(this.ledLine[i] == 1)
			{
				$(this.LEDS[i]).addClass("bus_line_on");
				$(this.LEDS[i]).removeClass("bus_line_off");
			}
			else
			{
				$(this.LEDS[i]).addClass("bus_line_off");
				$(this.LEDS[i]).removeClass("bus_line_on");
			}
		}
	}

	setValue(val)
	{
		if(val > 255 || val < 0 || !Number.isInteger(val))
		{
			if(val > 255)
				alert(this.regTitle + " || 8-bit error: numbers larger than 255 do not exist, " + val + " encountered");
			if(val < 0)
				alert(this.regTitle + " || 8-bit error: numbers larger than 255 do not exist, " + val + " encountered");
			if(!Number.isInteger(val))
				alert(this.regTitle + " can only take integer values, " + val + " encountered");
		}
		else
		{
			this.storedVal = val;
			this.calculateLEDs();
			this.valDispHundreds.setValue(Math.floor(val / 100));
			this.valDispTens.setValue(Math.floor(val / 10)%10);
			this.valDispUnits.setValue(val%10);
		}
		return this.storedVal;
	}

	getValue()
	{
		return this.storedVal;
	}

	rxValue()
	{
		this.setValue(this.systembus.getValue());
	}

	txValue()
	{
		this.systembus.setValue(this.getValue());
	}
}

/*
END classes
*/

/*
Functions
*/

function CreateComponent(addClass)
{
	return $("<div class='component " + addClass + "'><div class='componentheader'></div><div class='componentbody'></div></div>");
}

/*
END functions
*/


// Testing code
var SystemBus = 0;
function Test()
{
	SystemBus = new Bus($("#bus_1"), $("#bus_2"), $("#bus_3"), $("#bus_4"), $("#bus_5"), $("#bus_6"), $("#bus_7"), $("#bus_8"), $("#bus_header"), ".left_col");
	//for(let i = 0; i < 20; i++)
	//	mybus.setValue(i);
	//myclock = new Clock($(".left_col"));
	SystemBus.Clock.clockConnect(testcallback);
	regA = new Register($(".right_col"), "REGISTER A", SystemBus);
}

function testcallback(edge)
{
	if(edge)
	{
		SystemBus.setValue(SystemBus.getValue() + 1);
	}
	else
	{
		if(SystemBus.getValue() == 255)
			SystemBus.setValue(0);
	}
}

$( document ).ready(function() {
    console.log( "ready!" );
	Test();
});