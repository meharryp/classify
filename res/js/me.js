var myPanos = {}
var current = 0;

function showInfo(uid){
	$("#tagHeader").html("Tags");

	var tagText = "";
	var tags = [];

	if (myPanos[uid] !== undefined && myPanos[uid].tags !== "")
		tags = JSON.parse(myPanos[uid].tags);

	for (var i=0; i < tags.length; i++){
		console.log("i");
		tagText += tags[i]

		if (i < tags.length - 1){
			console.log(tagText)
			tagText += ", ";
		}
	}

	$("#tagText").html(tagText);

	$.ajax("/generateImage?pano=" + myPanos[uid].panoid + "&heading=" + myPanos[uid].heading + "&fov=" + myPanos[uid].zoom + "&pitch=" + myPanos[uid].pitch)
	.done(function(data){
		$("#panoImage").attr("src", data[0])
	});

	current = uid;
}

function editCurrent(){
	window.location = "/edit?uid=" + current;
}

$(document).ready(function(){
	var table = $("#classifytable");

	$.ajax({
		url: "/getClassified",
	}).done(function(data){
		var dat = JSON.parse(data);

		for (var i=0; i < dat.length; i++){
			var date = new Date(dat[i].created).toUTCString();
			table.append(`<tr><th scope="row">${date}</th><td><a href="javascript:showInfo(${dat[i].uid})">${dat[i].panoid}</a></td></tr>`)
			myPanos[dat[i].uid] = dat[i];
		}

		console.log(myPanos);
	});
});