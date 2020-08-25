const defaultTags = [
	"Mown",
	"Cuttings visible",
	"Grassy part of verge",
	"Hedgerow present",
	"Trees higher than hedgerow",
	"Roadside ditch",
	"Ditch spoil",
	"Crash barrier",
	"Junction",
	"Pavement",
	"Grips",
	"Layby",
	"Propery entrance",
	"Erosion present",
	"LoTV score incorrect"
]

const sides = {
	N: 0,
	NE: 45,
	E: 90,
	SE: 135,
	S: 180,
	SW: 225,
	W: 270,
	NW: 315
}

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

$(document).ready(function(){
	var select = $("#extraTags");
	select.append(new Option("Create new tag...", "newtag"));
	select.change(function(e){
		var value = $(this).val();

		if (value == "newtag"){
			value = prompt("Enter the name of the new tag.", "Tag name");
		}

		if (value != "ignore"){
			var tag = document.createElement("input");
			tag.setAttribute("type", "checkbox");
			tag.setAttribute("id", value);
			tag.checked = true;

			$("#moreTags").append(value);
			$("#moreTags").append(tag);
		}

		$(this).val("ignore");
	});

	for (var i=0; i < defaultTags.length; i++){
		var tag = document.createElement("input");
		tag.setAttribute("type", "checkbox");
		tag.setAttribute("id", defaultTags[i]);

		var label = document.createElement("label");
		label.setAttribute("for", defaultTags[i]);
		label.innerHTML = defaultTags[i];

		$("#defaultTags").append(tag);
		$("#defaultTags").append(label);
	}

	loadTags();
});