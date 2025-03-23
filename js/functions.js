function ToBinaryArray(val, width)
{
    return (val >>> 0).toString(2).padStart(width, "0").split("");
}

function ToBinaryString(val, width)
{
    return (val >>> 0).toString(2).padStart(width, "0");
}

function CreateComponent(addClass)
{
	return $("<div class='component " + addClass + "'><div class='componentheader'></div><div class='componentbody'></div></div>");
}

function generateUUID() { // Public Domain/MIT from https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}