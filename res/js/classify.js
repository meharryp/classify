// change defaultOffset to change the default value the camera is offset by when
// first displaying the image to the user
const defaultOffset = 90;

var sideMode = false;
var curSide = "";

var curUID = 0;

function getPic(){
	$.ajax("/getImage").done(function(data){
		var json = JSON.parse(data)
		curPic = json.panoid;
		curUID = json.uid;

		console.log(data);

		if (!sView){
			var view = new google.maps.StreetViewPanorama(
				document.getElementById("streetDummy"), {
					pano: curPic,
					linksControl: false,
					eanbleCloseButton: false,
					addressControl: false,
					fullscreenControl: false,
					linksControl: false,
					showRoadLabel: false,
					clickToGo: false
				}
			);

			view.addListener("position_changed", function(){
				var pov = view.getPhotographerPov();
				heading = pov.heading;
				pitch = pov.pitch;
				zoom = 120;

				updatePreview();
			});

			sView = view;
			sv = new google.maps.StreetViewService();
		} else {
			sView.setPano(curPic);
		}


		if (!json.side || json.side === "" || json.side == "Error")
			sideMode = true;
		else {
			curSide = json.side;
			sideMode = false;
		}

		$("#lotvscore").html(`LoTV Score: ${json.lotvscore}`)
	});
}

function updatePreview(){
	var tHeading = 0;

	if (side && sideMode)
		tHeading = heading + defaultOffset;
	else if (sideMode)
		tHeading = heading - defaultOffset;

	// attempt to guess and create a better view of the side the verge is on
	if (!sideMode){
		var left = (heading - defaultOffset) % 360;
		var right = (heading + defaultOffset) % 360;

		if (left - sides[curSide] > right - sides[curSide])
			tHeading = left;
		else
			tHeading = right;
	}

	sView.setPov({
		heading: tHeading,
		pitch: pitch,
		zoom: 0
	});
}

function nextImage(bad){
	var tags;
	var pov = sView.getPov();

	if (bad)
		tags = ["bad"];
	else
		tags = GetTags();

	$.ajax({
		url: "/saveImageData",
		method: "POST",
		data: JSON.stringify({
			panoid: curUID,
			heading: pov.heading,
			pitch: pov.pitch,
			zoom: (180 * Math.pow(0.5, pov.zoom)) + 5,
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

	if (!side && sideMode){
		side = true;
		updatePreview();
	} else {
		side = false;
		getPic();
	}
}