var sView;

// Converts from degrees to radians.
function toRadians(degrees) {
	return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
function toDegrees(radians) {
	return radians * 180 / Math.PI;
}

const MAX_TRIES = 500;
var curTries = 0;

// https://stackoverflow.com/a/27943
function distance(lat1,lon1,lat2,lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = toRadians(lat2-lat1);
	var dLon = toRadians(lon2-lon1);
	var a =
		Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
		Math.sin(dLon/2) * Math.sin(dLon/2)
	;
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = R * c; // Distance in km
	return d;
}

// https://stackoverflow.com/a/52079217
function bearing(startLat, startLng, destLat, destLng){
	startLat = toRadians(startLat);
	startLng = toRadians(startLng);
	destLat = toRadians(destLat);
	destLng = toRadians(destLng);

	y = Math.sin(destLng - startLng) * Math.cos(destLat);
	x = Math.cos(startLat) * Math.sin(destLat) -
							Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
	brng = Math.atan2(y, x);
	brng = toDegrees(brng);
	return (brng + 360) % 360;
}

function getPic(){
	curTries = 0;
	var coords = {lat: parseFloat($("#latInput").val()), lng: parseFloat($("#longInput").val())};
	var end = {lat: parseFloat($("#latInput1").val()), lng: parseFloat($("#longInput1").val())};
	var targetHeading = bearing(coords.lat, coords.lng, end.lat, end.lng);

	$.ajax({
		url: "/snapToRoads",
		method: "POST",
		data: JSON.stringify({
			path: [coords, end]
		}),
		dataType: "json",
		contentType: "application/json"
	}).done(function(data){
		console.log(data);
		buildFromRoad(data, coords)
	});
}


function buildFromRoad(road, coords){
	var view = new google.maps.StreetViewPanorama(
		document.getElementById("streetDummy")
	);

	sView = view

	var startLen = road.length;

	view.setPosition(coords);

	var sv = new google.maps.StreetViewService();
	var output = [];

	view.addListener("position_changed", function(){
		if (curTries > MAX_TRIES || road.length == 0){
			sendFoundPanos(output);
			return;
		}

		var heading = view.getPhotographerPov().heading;
		console.log(heading);
		coords = view.getPosition();

		console.log("pano changed")
		$("#output").text(`Processing roads... (${(1/startLen/road.length)*1000}%)`)

		$.ajax("/generateImage?pano=" + view.getPano() + "&heading=" + view.getPhotographerPov().heading)
		.done(function(data){
			console.log(data);
			$("#image1").attr("src", data[0]);
			$("#image2").attr("src", data[1]);

			output.push(view.getPano());

			var done = false;
			while (!done){
				if (road.length == 0)
					break;

				// check distance between current road segment and pano location
				var nextPos = road[0].location;
				var dist = distance(coords.lat(), coords.lng(), nextPos.latitude, nextPos.longitude);

				console.log(dist);

				// if distance is less than 20m pop top road segment
				if (dist < 0.02){
					road.shift();
				} else {
					done = true;
				}
			}

			console.log(road);

			if (road.length == 0){
				sendFoundPanos(output);
				return;
			}

			// check heading between next road segement and current road segment
			var nextPos = road[0].location;
			heading = bearing(coords.lat(), coords.lng(), nextPos.latitude, nextPos.longitude);

			console.log(heading)

			var panoLoc = {lat: coords.lat(), lng: coords.lng()};

			// find next pano with heading closest to that
			sv.getPanorama({pano: view.getPano()}, (d) =>{
				console.log(data);
				var closestPano = "";
				var closestDist = 99999;

				for (var i=0; i < d.links.length; i++){
					var dist = Math.abs(heading - d.links[i].heading);
					if (dist < closestDist){
						closestPano = d.links[i].pano;
						closestDist = dist;
					}
				}

				console.log(closestPano);

				if (!output.includes(closestPano)){
					setTimeout(function(){
						view.setPano(closestPano);
					}, 500);
				}

				curTries++;
			});
		});
	});
}

function sendFoundPanos(output){
	console.log(output);
	$("#output").text("Uploading data...");

	$.ajax({
		url: "/saveCoords",
		method: "POST",
		data: JSON.stringify({
			data: output
		}),
		dataType: "json",
		contentType: "application/json"
	}).done(function(data){
		console.log(data);
		buildFromRoad(data, coords)
	});
}