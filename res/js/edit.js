var uid = window.location.search.substring(1).split("=")[1];

function getPic(){
	$.ajax("/getClassified/" + uid).done(function(data){
		var res = JSON.parse(data);
		curPic = res.panoid;

		var view = new google.maps.StreetViewPanorama(
			document.getElementById("streetDummy"), {
				pano: curPic
			}
		);

		sView = view;

		sv = new google.maps.StreetViewService();

		var pov = view.getPhotographerPov();
		heading = res.heading;
		pitch = res.pitch;
		zoom = res.zoom;

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
	var tHeading = heading;

	$.ajax("/generateImage?pano=" + curPic + "&heading=" + tHeading + "&fov=" + zoom + "&pitch=" + pitch)
	.done(function(data){
		$("#image1").attr("src", data[0]);
	});
}

function nextImage(bad){
	var tags;

	if (bad)
		tags = ["bad"];
	else
		tags = GetTags();

	$.ajax({
		url: "/editImageData",
		method: "POST",
		data: JSON.stringify({
			uid: parseInt(uid),
			heading: heading,
			pitch: pitch,
			zoom: zoom,
			tags: tags
		}),
		contentType: "application/json"
	}).done(function(data){
		console.log("a")
		window.location = "/me"
	});
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