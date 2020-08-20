// change defaultOffset to change the default value the camera is offset by when
// first displaying the image to the user
const defaultOffset = 90;

function getPic(){
	$.ajax("/getImage").done(function(data){
		var json = JSON.parse(data)
		curPic = json.panoid;

		var view = new google.maps.StreetViewPanorama(
			document.getElementById("streetDummy"), {
				pano: curPic
			}
		);

		sView = view;

		sv = new google.maps.StreetViewService();

		view.addListener("position_changed", function(){
			var pov = view.getPhotographerPov();
			heading = pov.heading;
			pitch = pov.pitch;
			zoom = 120;

			updatePreview();
		});

		$("#lotvscore").html(`LoTV Score: ${json.lotvscore}`)
	});
}

function updatePreview(){
	var tHeading = 0;

	if (side)
		tHeading = heading + 90;
	else
		tHeading = heading - 90;

	$.ajax("/generateImage?pano=" + curPic + "&heading=" + tHeading + "&fov=" + zoom + "&pitch=" + pitch)
	.done(function(data){
		if (!side)
			$("#image1").attr("src", data[0]);
		else
			$("#image1").attr("src", data[1]);
	});
}

function nextImage(bad){
	if (side)
		tHeading = heading + 90;
	else
		tHeading = heading - 90;

	var tags;

	if (bad)
		tags = ["bad"];
	else
		tags = GetTags();

	$.ajax({
		url: "/saveImageData",
		method: "POST",
		data: JSON.stringify({
			panoid: curPic,
			heading: tHeading,
			pitch: pitch,
			zoom: zoom,
			tags: tags
		}),
		dataType: "json",
		contentType: "application/json"
	}).done(function(data){

	});

	$("#moreTags").text("");

	var checkboxes = $(":checkbox");

	for (var i=0; i < checkboxes.length; i++){
		checkboxes[i].checked = false
	}

	headding = 0;
	zoom = 120;
	pitch = 0;

	resetCamera();

	if (!side){
		side = true;
		updatePreview();
	} else {
		side = false;
		getPic();
	}
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

		$("#defaultTags").append(defaultTags[i]);
		$("#defaultTags").append(tag);
	}

	loadTags();
});