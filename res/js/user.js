$(document).ready(function(){
	$.ajax("/getUser").done(function(data){
		var res = JSON.parse(data);
		$("#username").html(res.username);
		$("#homeWelcome").html("Hi " + res.username + ", what would you like to do?")

		if (res.admin === 1){
			$("#navbarNav .navbar-nav").append(`
				<li class="nav-item">
					<a class="nav-link" href="/newUser">Create new user</a>
				</li>
			`)
		}
	});
})

function changePassword(){
	var password = $("#password1").val();

	if (password === $("#password2").val()){
		$.ajax({
			url: "/changePassword",
			method: "POST",
			data: JSON.stringify({
				password: password
			}),
			contentType: "application/json"
		}).done(function(data){
			$("#passwordInfo").html("Successfully changed your password!");
		});
	} else {
		$("#passwordInfo").html("The passwords don't match. Try and input them again.")
	}
}

function createUser(){
	var username = $("form #username").val();
	var password = $("#password").val();
	var admin = $("#admin")[0].checked;

	$.ajax({
		url: "/createUser",
		method: "POST",
		data: JSON.stringify({
			user: username,
			password: password,
			admin: admin
		}),
		contentType: "application/json"
	}).done(function(data){
		if (data == "ok"){
			$("#loginMessage").html("Successfully created a new user.");
		} else {
			$("#loginMessage").html("Something went wrong. Try again later. (" + JSON.stringify(data) + ")");
		}
	});
}