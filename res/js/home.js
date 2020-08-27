$(document).ready(function(){
	$.ajax("/getStats").done(function(res){
		var data = JSON.parse(res);
		console.log(data)
		$("#homeStats").html(data.classified + " images have been classified so far!");
	});

	var table = $("#classifytable");

	$.ajax("/getRecent").done(function(data){
		var dat = JSON.parse(data);

		for (var i=0; i < dat.length; i++){
			var date = new Date(dat[i].created).toUTCString();
			table.append(`<tr><th scope="row">${date}</th><td>${dat[i].panoid}</td></tr>`)
		}
	});
});