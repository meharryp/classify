var uid = window.location.search.substring(1).split("=")[1];

function getPic(){
	$.ajax("/getClassified/" + uid).done(function(data){
		var res = JSON.parse(data);
		curPic = res.panoid;
		curUID = res.uid;

		console.log(res);

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

			heading = res.heading;
			pitch = res.pitch;
			zoom = res.zoom;

			sView = view;
			sv = new google.maps.StreetViewService();

			view.addListener("position_changed", function(){
				updatePreview();
			});
		} else {
			sView.setPano(curPic);
		}

		// do something to check tags
		var tags = [];
		var extraTags = [];
		var normalTags = [];

		if (res.tags !== undefined && res.tags !== "")
			tags = JSON.parse(res.tags);

		for (var i=0; i < tags.length; i++){
			if (!defaultTags.includes(tags[i])){
				extraTags.push(tags[i]);
			}
			else{
				normalTags.push(tags[i]);
			}
		}

		for (var i=0; i < extraTags.length; i++){
			var tag = document.createElement("input");
			tag.setAttribute("type", "checkbox");
			tag.setAttribute("id", extraTags[i]);
			tag.checked = true;

			$("#moreTags").append(extraTags[i]);
			$("#moreTags").append(tag);
		}

		for (var i=0; i < normalTags.length; i++){
			document.getElementById(normalTags[i]).checked = true
			console.log("set " + normalTags[i])
		}

		updatePreview();
	});
}

function updatePreview(){
	sView.setPov({
		heading: heading,
		pitch: pitch,
		zoom: (Math.log(zoom/180) / Math.log(0.5))
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
		url: "/editImageData",
		method: "POST",
		data: JSON.stringify({
			uid: parseInt(uid),
			heading: pov.heading,
			pitch: pov.pitch,
			zoom: (180 * Math.pow(0.5, pov.zoom)) + 5,
			tags: tags
		}),
		contentType: "application/json"
	}).done(function(data){
		console.log("a")
		window.location = "/me"
	});
}