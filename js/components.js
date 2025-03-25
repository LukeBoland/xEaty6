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
		this.Clock = new Clock($(clockLocation));
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
			this.busValue = val;
			this.calculateBusLine();
		}
		return this.busValue;
	}
	
	calculateBusLine()
	{
		this.busLine = ToBinaryArray(this.busValue, 8);
		this.showBusLine();
	}
	
	showBusLine()
	{
		for(let i=0; i < 8; i++)
		{
			if(this.busLine[i] == 1)
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
		return this.busValue + " - 0x" + (this.busValue >>> 0).toString(16) + " - 0b" + ToBinaryString(this.busValue, 8);
	}
	
	getValue()
	{
		return this.busValue;
	}
}

class Clock
{
	constructor(target)
	{
		this.downstream = [];
		this.speed = 8; //Initalise at 8Hz
		this.clockdiv = CreateComponent('comp_clock');
		this.clockdiv.children(".componentheader")[0].textContent = "CLOCK MODULE";
		this.clockdiv.children(".componentheader").append($("<div class='led led_off' style='float: right; margin-top: -1px;' id='clockled'>&nbsp;</div>"));
		this.btn_switch = $("<label id='clockswitch' class='switch clockswitch'>Clock: <input type='checkbox' id='clockcontrol'><span class='slider round'></span></label>");
		this.clockdiv.children(".componentheader").append(this.btn_switch);
		this.clockdiv.children(".componentheader").append($("<div id='halt' style='float: right; margin-top: -1px; margin-right: 10px; color: red;'><button id='clockreset' style='margin-right:10px'>Reset</button>SYSTEM HALTED</div>"));
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
				SystemBus.Clock.clockStart();
			else
				SystemBus.Clock.clockStop();
		});
		$("#stepbutton").mousedown(function(){
			SystemBus.Clock.pulse(SystemBus.Clock);
		});
		$("#stepbutton").mouseup(function(){
			SystemBus.Clock.pulse(SystemBus.Clock);
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
					SystemBus.Clock.setSpeed(ui.value);
				}
			  });
		});
		$("#clockreset").click(function(){
			SystemBus.Clock.clockReset();
		});
		$("#halt").hide();
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

	systemHalt()
	{
		this.clockStop();
		$("#clockswitch").hide();
		$("#halt").show();
		$("#clockcontrol").prop( "checked", false );
	}

	clockReset()
	{
		$("#clockswitch").show();
		$("#halt").hide();
	}

	getStatus()
	{
		return this.active;
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
	constructor(target, regTitle, systembus, size)
	{
		this.component = CreateComponent("comp_register");
		this.regTitle = regTitle;
		this.storedVal = 0;
		this.ledLine = [];
		this.size = size;
		this.maxvalue = Math.pow(2, size) - 1;
		this.LEDS = [];
		this.systembus = systembus;
		this.component.children(".componentheader")[0].textContent = this.regTitle;
		for(let i=0; i<size; i++)
		{
			this.LEDS[i] = $("<div class='led led_off'>&nbsp;</div>");
			this.component.children(".componentbody").append(this.LEDS[i]);
		}
		this.valDisp = $("<div style='grid-row: 1 / span 3; grid-column:9;'><fieldset style='width: 250px'><legend>Value</legend</fieldset></div><div class='rx_from_bus' style='grid-column:1 / span 3;'><div class='arrowed'><div class='arrow-r'></div></div>IN</div><div class='tx_to_bus' style='grid-column:1 / span 3;'><div class='arrowed'><div class='arrow-l'></div></div>OUT</div>");
		if(this.maxvalue > 99)
			this.valDispHundreds = new SevenSegmentDisplay(this.valDisp.children("fieldset"));
		if(this.maxvalue > 9)
		this.valDispTens = new SevenSegmentDisplay(this.valDisp.children("fieldset"));
		this.valDispUnits = new SevenSegmentDisplay(this.valDisp.children("fieldset"));
		this.component.children(".componentbody").append(this.valDisp);
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
				console.log(this.valDisp[1]);
				$(this.valDisp[1]).addClass("rx_from_bus_active");
				$(this.valDisp[2]).removeClass("tx_to_bus_active");
				break;
			case 0: // disconnected from bus
				this.mode = 0;
				$(this.valDisp[1]).removeClass("rx_from_bus_active");
				$(this.valDisp[2]).removeClass("tx_to_bus_active");
				break;
			case 1: // tx data to bus
				this.mode = 1;
				console.log(this.valDisp[2]);
				$(this.valDisp[2]).addClass("tx_to_bus_active");
				$(this.valDisp[1]).removeClass("rx_from_bus_active");
				break;
			default:
				return false;
		}
	}

	calculateLEDs()
	{
		this.ledLine = ToBinaryArray(this.storedVal, this.size);
		this.showLEDLine();
	}
	
	showLEDLine()
	{
		for(let i=0; i < this.size; i++)
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
		if(val > this.maxvalue || val < 0 || !Number.isInteger(val))
		{
			if(val > this.maxvalue)
				console.log(this.regTitle + " || " + this.size + "-bit error: numbers larger than " + Math.pow(2,this.size)-1 + " do not exist, " + val + " encountered");
			if(val < 0)
				console.log(this.regTitle + " || " + this.size + "-bit error: numbers smaller than 0 do not exist, " + val + " encountered");
			if(!Number.isInteger(val))
				console.log(this.regTitle + " can only take integer values, " + val + " encountered");
			return false;
		}
		else
		{
			this.storedVal = val;
			this.calculateLEDs();
			if(this.maxvalue > 99)
				this.valDispHundreds.setValue(Math.floor(val / 100));
			if(this.maxvalue > 9)
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
		return this.systembus.setValue(this.getValue());
	}

	incValue()
	{
		return this.setValue(this.storedVal + 1);
	}
}

class ALU
{
	constructor(target, systembus)
	{
		this.component = new CreateComponent("comp_ALU");
		this.storedVal = 0;
		this.mode = true; // true for addition, false for subtraction
		this.ledLine = [];
		this.LEDS = [];
		this.primaryRegister = false;
		this.secondaryRegister = false;
		this.systembus = systembus;
		this.component.children(".componentheader")[0].textContent = "ALU";
		for(let i=0; i<8; i++)
		{
			this.LEDS[i] = $("<div class='led led_off'>&nbsp;</div>");
			this.component.children(".componentbody").append(this.LEDS[i]);
		}
		this.valDisp = $("<div style='grid-row: 1 / span 3; grid-column:9;'><fieldset style='width: 250px'><legend>Value</legend</fieldset></div><div class='tx_to_bus' style='grid-column:1 / span 3;'><div class='arrowed'><div class='arrow-l'></div></div>OUT</div>");
		this.valDispHundreds = new SevenSegmentDisplay(this.valDisp.children("fieldset"));
		this.valDispTens = new SevenSegmentDisplay(this.valDisp.children("fieldset"));
		this.valDispUnits = new SevenSegmentDisplay(this.valDisp.children("fieldset"));
		this.component.children(".componentbody").append(this.valDisp);
		this.modeDisp = $("<div style='grid-column: 4 / span 3;'><fieldset><legend>Mode</legend><label><input type='radio' name='alu_mode' checked='checked' /> Addition</label><br /><label><input type='radio' name='alu_mode' /> Subtraction</label></fieldset></div>");
		this.component.children(".componentbody").append(this.modeDisp);
		target.append(this.component);
	}

	setPrimaryInput(reg)
	{
		this.primaryRegister = reg;
		if(this.secondaryRegister)
		{
			this.setValue();
			this.calculateLEDs();
		}
	}

	setSecondaryInput(reg)
	{
		this.secondaryRegister = reg;
		if(this.primaryRegister)
		{
			this.setValue();
			this.calculateLEDs();
		}
	}

	setMode(mode)
	{
		this.mode = mode;
		if(mode)
		{
			$(this.modeDisp[0].children[0].children[1].children[0]).prop( "checked", true );
			$(this.modeDisp[0].children[0].children[3].children[0]).prop( "checked", false );
			console.log($(this.modeDisp[0].children[0].children[1].children[0]));
		}
		else
		{
			$(this.modeDisp[0].children[0].children[1].children[0]).prop( "checked", false );
			$(this.modeDisp[0].children[0].children[3].children[0]).prop( "checked", true );
		}
	}

	calculateLEDs()
	{
		this.ledLine = ToBinaryArray(this.storedVal, 8);
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

	setValue()
	{
		if(this.mode)
			this.storedVal = this.primaryRegister.getValue() + this.secondaryRegister.getValue();
		else
			this.storedVal = this.primaryRegister.getValue() - this.secondaryRegister.getValue();
		this.calculateLEDs();
		this.valDispHundreds.setValue(Math.floor(this.storedVal / 100));
		this.valDispTens.setValue(Math.floor(this.storedVal / 10) % 10);
		this.valDispUnits.setValue(this.storedVal % 10);
		return this.storedVal;
	}

	getValue()
	{
		return this.storedVal;
	}

	txValue()
	{
		this.systembus.setValue(this.getValue());
	}
}

class ROM
{
	constructor(target, systembus, size)
	{
		this.systembus = systembus;
		this.addressRegister = new Register(target, "ADDRESS REGISTER", systembus, (size-1).toString(2).length);
		this.component = CreateComponent('comp_rom');
		this.component.children(".componentheader")[0].textContent = "ROM";
		let startAddress = 0;
		this.size = size;
		this.dataTable = $("<div><table id='rom'></table></div>");
		for(let i=0; i<size; i += 8)
		{
			$(this.dataTable[0].children[0]).append($("<tr><td class='rom_header'>0x" + i.toString(16).padStart(2,"0") + "</td><td id='rom_" + i.toString(16).padStart(2,"0") + "' ondblclick='EditAddress($(this))'>00</td><td id='rom_" + (i+1).toString(16).padStart(2,"0") + "' ondblclick='EditAddress($(this))'>00</td><td id='rom_" + (i+2).toString(16).padStart(2,"0") + "' ondblclick='EditAddress($(this))'>00</td><td id='rom_" + (i+3).toString(16).padStart(2,"0") + "' ondblclick='EditAddress($(this))'>00</td><td id='rom_" + (i+4).toString(16).padStart(2,"0") + "' ondblclick='EditAddress($(this))'>00</td><td id='rom_" + (i+5).toString(16).padStart(2,"0") + "' ondblclick='EditAddress($(this))'>00</td><td id='rom_" + (i+6).toString(16).padStart(2,"0") + "' ondblclick='EditAddress($(this))'>00</td><td id='rom_" + (i+7).toString(16).padStart(2,"0") + "' ondblclick='EditAddress($(this))'>00</td></tr>"));
		}
		this.component.children(".componentbody").append(this.dataTable);
		$(this.addressRegister.valDisp[1]).hide();
		$(this.addressRegister.valDisp[2]).hide();
		target.append(this.component);
		this.previousAddress = false;
	}


	selectAddress(address)
	{
		if(address <= this.size)
		{
			this.addressRegister.setValue(address);
			$("#rom_" + address.toString(16).padStart(2, "0")).addClass("selectROM");
			$("#rom_" + this.previousAddress).removeClass("readROM");
			$("#rom_" + this.previousAddress).removeClass("writeROM");
			$("#rom_" + this.previousAddress).removeClass("selectROM");
			console.log(this.previousAddress);
			this.previousAddress = address.toString(16).padStart(2, "0");
		}
		else
		{
			console.log("Memory Address " + address + " out of bounds");
			return false;
		}
		return true;
	}

	readAddress(address)
	{
		$("#rom_" + this.previousAddress).removeClass("readROM");
		$("#rom_" + this.previousAddress).removeClass("selectROM");
		$("#rom_" + this.previousAddress).removeClass("writeROM");
		$("#rom_" + address.toString(16).padStart(2, "0")).addClass("readROM");
		this.previousAddress = address.toString(16).padStart(2, "0");
		$("#rom_" + address.toString(16).padStart(2, "0"))[0].scrollIntoView();
		return parseInt($("#rom_" + address.toString(16).padStart(2, "0"))[0].textContent);
	}

	writeAddress(address, value)
	{
		if(value >= 0 && value <= 255)
		{
			$("#rom_" + this.previousAddress).removeClass("readROM");
			$("#rom_" + this.previousAddress).removeClass("selectROM");
			$("#rom_" + this.previousAddress).removeClass("writeROM");
			$("#rom_" + address.toString(16).padStart(2, "0")).addClass("writeROM");
			this.previousAddress = address.toString(16).padStart(2, "0");
			$("#rom_" + address.toString(16).padStart(2, "0"))[0].scrollIntoView();
			$("#rom_" + address.toString(16).padStart(2, "0"))[0].textContent = value.toString(16).padStart(2, "0");
			return $("#rom_" + address.toString(16).padStart(2, "0"))[0].textContent;
		}
		else
		{
			console.log("8-bit error: " + value + " is outside of bounds")
			return false;
		}
	}
}

/*
END classes
*/

// Testing code
var SystemBus = 0;
function Test()
{
	SystemBus = new Bus($("#bus_1"), $("#bus_2"), $("#bus_3"), $("#bus_4"), $("#bus_5"), $("#bus_6"), $("#bus_7"), $("#bus_8"), $("#bus_header"), ".left_col");
	console.log(SystemBus.Clock);
	SystemBus.Clock.clockConnect(testcallback);
	pc = new Register($(".right_col"), "PROGRAM COUNTER", SystemBus, 4);
	regA = new Register($(".right_col"), "REGISTER A", SystemBus, 8);
	aluA = new ALU($(".right_col"), SystemBus);
	regB = new Register($(".right_col"), "REGISTER B", SystemBus, 8);
	display = new Register($(".right_col"), "DISPLAY MODULE", SystemBus, 8);
	$(this.display.valDisp[2]).hide();
	aluA.setPrimaryInput(regA);
	aluA.setSecondaryInput(regB);
	rom = new ROM($(".left_col"), SystemBus, 16);
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