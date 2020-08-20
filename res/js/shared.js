const defaultTags = [
	"Mown",
	"Hedgerow present",
	"Crash barrier",
	"Junction in foreground",
	"Pavement present",
	"LoTV score incorrect"
]

var tags;

var sView;
var sv;

var curPic = "";
var heading = 0;
var pitch = 0;
var zoom = 0;

var side = false;

function resetCamera(){
	var pov = sView.getPhotographerPov();
	heading = pov.heading;
	pitch = pov.pitch;
	zoom = 90;
}

function loadTags(){
	$.ajax({
		url: "/loadTags",
	}).done(function(data){
		var dat = JSON.parse(data);
		var out = [];

		for (var i=0; i < dat.length; i++){
			if (!defaultTags.includes(dat[i].tag))
				out.push(dat[i]);
		}

		for (var i=0; i < out.length; i++){
			var a = $("#extraTags").append(new Option(out[i].tag + " (" + out[i].count + ")", out[i].tag));
		}
	});
}

function GetTags(){
	var tags = $(":checkbox");
	var out = [];

	for (var i=0; i < tags.length; i++){
		if (tags[i].checked)
			out.push(tags[i].id);
	}

	return out;
}

function nudgeUp(){
	pitch =+ 1;
	updatePreview();
}

function nudgeDown(){
	pitch -= 1;
	updatePreview();
}

function nudgeLeft(){
	heading -= 1;
	updatePreview();
}

function nudgeRight(){
	heading += 1;
	updatePreview();
}

function zoomIn(){
	zoom -= 5;
	updatePreview();
}

function zoomOut(){
	zoom += 5;
	updatePreview();
}