function login(){
	var username = $("#username").val();
	var password = $("#password").val();

	$.ajax({
		url: "/login",
		method: "POST",
		data: JSON.stringify({
			user: username,
			password: password
		}),
		contentType: "application/json"
	}).done(function(data){
		if (data == "ok"){
			$("#loginMessage").html("Logging you in...");
			window.location = "/";
		} else {
			$("#loginMessage").html("Your username or password was incorrect.");
		}
	});
}