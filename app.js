// http://live-twt-d8-lincolnshire.pantheonsite.io/sites/default/files/2018-05/roadside_reserves.pdf

const {Client, Status} = require("@googlemaps/google-maps-services-js");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const mysql = require("mysql");
const crypto = require("crypto");
const config = JSON.parse(require("fs").readFileSync(__dirname + "/config.json"));

const APIKEY = config.google.apikey;

const client = new Client({});
const app = express();

app.use(bodyParser.json());
app.use(express.static("res"));
app.use(cookieParser());

var db = mysql.createConnection({
	host: config.mysql.host,
	user: config.mysql.user,
	password: config.mysql.password,
	database: config.mysql.database,
	port: config.mysql.port
})

db.connect((err) => {
	if (err){
		console.error(err);
		return;
	}

	db.query(`CREATE TABLE IF NOT EXISTS gm_panos(
		uid INT NOT NULL PRIMARY KEY,
		panoid VARCHAR(64),
		lotvscore VARCHAR(16),
		side VARCHAR(8)
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS gm_classified(
		uid INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
		panouid VARCHAR(64) NOT NULL,
		heading DOUBLE NOT NULL,
		pitch DOUBLE NOT NULL,
		zoom DOUBLE NOT NULL,
		tags TEXT,
		created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		userid INT
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS gm_tags(
		tag VARCHAR(64) PRIMARY KEY,
		count INT
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS gm_users(
		uid INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(32) UNIQUE,
		password TEXT,
		admin BOOL NOT NULL DEFAULT 0
	)`);

	// create default admin account with password "password"
	// PLEASE CHANGE THE PASSWORD BEFORE USING
	db.query(`INSERT INTO gm_users(uid, username, password, admin) VALUES(0, "admin", "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", 1)`, function(){});
});

var activeTokens = {};

function needsAuth(req, res, next){
	var token = req.cookies["token"];
	req.user = activeTokens[token];

	if (req.user)
		next();
	else
		res.redirect("/");
}

function needsAdmin(req, res, next){
	var token = req.cookies["token"];
	req.user = activeTokens[token];

	if (req.user){
		db.query("SELECT * FROM gm_users WHERE uid = ?", [req.user], function(err, r, fields){
			if (r && r.length > 0 && r[0].admin == 1)
				next();
			else
				res.redirect("/")
		});
	} else {
		res.redirect("/");
	}
}

function GetRoadside(lat, long, cb){
	client.nearestRoads({
		params: {
			points: [{lat: lat, lng: long}],
			key: APIKEY
		},
		timeout: 1000
	}).then((res) => {
		if (cb) cb(res.data.snappedPoints[0]);
	}).catch((e) => {
		console.log(e);
	});
}

function SnapToRoads(path, cb){
	client.snapToRoads({
		params: {
			path: path,
			interpolate: true,
			key: APIKEY
		},
		timeout: 1000
	}).then((res) => {
		if (cb) cb(res.data.snappedPoints);
	}).catch((e) => {
		console.log(e);
	});
}

function hashPass(password){
	var sha256 = crypto.createHash("sha256");
	return sha256.update(password).digest("hex");
}

function createToken(){
	return crypto.randomBytes(32).toString("hex");
}

app.get("/", (req,  res) => {
	var token = req.cookies["token"];

	if (activeTokens[token])
		res.sendFile(__dirname + "/res/home.html");
	else
		res.sendFile(__dirname + "/res/login.html");
});

app.get("/mapjs", needsAuth, (req, res) => {
	res.redirect(302, "https://maps.googleapis.com/maps/api/js?key=" + APIKEY + "&callback=getPic");
});

app.get("/classify", needsAuth, (req, res) => {
	res.sendFile(__dirname + "/res/classify.html");
});

app.get("/me", needsAuth, (req, res) => {
	res.sendFile(__dirname + "/res/me.html");
});

app.get("/edit", needsAuth, (req, res) => {
	res.sendFile(__dirname + "/res/edit.html");
});

app.get("/help", needsAuth, (req, res) => {
	res.sendFile(__dirname + "/res/help.html");
});

app.get("/password", needsAuth, (req, res) => {
	res.sendFile(__dirname + "/res/password.html");
});

app.get("/newUser", needsAdmin, (req, res) => {
	res.sendFile(__dirname + "/res/createuser.html");
});

app.post("/login", (req, res) => {
	var user = req.body.user;
	var password = hashPass(req.body.password);

	db.query("SELECT * FROM gm_users WHERE username = ? AND password = ?", [user, password], function(err, r, fields){
		if (r && r.length > 0){
			var token = createToken();
			activeTokens[token] = r[0].uid;

			res.cookie("token", token);

			res.send("ok")
		} else {
			res.send("Invalid username or password");
		}
	});
});

app.post("/createUser", needsAdmin, (req, res) => {
	var user = req.body.user;
	var password = hashPass(req.body.password);
	var admin = req.body.admin;

	db.query("INSERT INTO gm_users(username, password, admin) VALUES(?, ?, ?)", [user, password, admin], function(err, r, fields){
		if (err)
			res.send(err);
		else
			res.send("ok");
	});
});

app.get("/logout", (req, res) => {
	res.cookie("token", "");
	res.redirect("/")
});

app.post("/changePassword", needsAuth, (req, res) => {
	var password = hashPass(req.body.password);

	db.query("UPDATE gm_users(password) VALUES(?) WHERE uid = ?", [password, req.user], function(){
		res.send("changed");
	});
});

app.post("/nearestRoad", needsAuth, (req, res) => {
	GetRoadside(req.body.path, data => {
		res.send(data);
	});
});

app.post("/snapToRoads", needsAuth, (req, res) => {
	SnapToRoads(req.body.path, data => {
		res.send(data);
	})
});

app.get("/generateImage", needsAuth, (req, res) => {
	res.send([
		"https://maps.googleapis.com/maps/api/streetview?pano=" + req.query.pano + "&size=1280x720&heading=" + req.query.heading + "&fov=" + req.query.fov + "&pitch=" + req.query.pitch + "&key=" + APIKEY,
		"https://maps.googleapis.com/maps/api/streetview?pano=" + req.query.pano + "&size=1280x720&heading=" + req.query.heading + "&fov=" + req.query.fov + "&pitch=" + req.query.pitch + "&key=" + APIKEY
	]);
});

app.get("/inputCoords", needsAdmin, (req, res) => {
	res.sendFile(__dirname + "/res/coords.html")
});

app.get("/getClassified", needsAuth, (req, res) => {
	var userid = req.user;

	db.query(`SELECT gm_classified.uid, gm_classified.heading, gm_classified.pitch, gm_classified.zoom, gm_classified.tags, gm_classified.created, gm_panos.panoid
		FROM gm_classified
		RIGHT JOIN gm_panos ON gm_classified.panouid = gm_panos.uid
		WHERE userid = ?`, [userid], function(err, r, fields){
		res.send(JSON.stringify(r));
	});
});

app.get("/getClassified/:uid", needsAuth, (req, res) => {
	db.query(`SELECT gm_classified.uid, gm_classified.heading, gm_classified.pitch, gm_classified.zoom, gm_classified.tags, gm_classified.created, gm_panos.panoid
		FROM gm_classified
		RIGHT JOIN gm_panos ON gm_classified.panouid = gm_panos.uid
		WHERE gm_classified.uid = ?`, [req.params.uid], function(err, r, fields){
		res.send(JSON.stringify(r[0]));
	});
});

app.post("/saveCoords", needsAdmin, (req, res) => {
	var ids = req.body.data;

	for (var i=0; i < ids.length; i++){
		db.query("INSERT INTO gm_panos VALUES(?)", [ids[i]]);
	}
});

app.post("/saveImageData", needsAuth, (req, res) => {
	var userid = req.user;

	var panoid = req.body.panoid;
	var tags = req.body.tags;
	var heading = req.body.heading;
	var pitch = req.body.pitch;
	var zoom = req.body.zoom;

	db.query("INSERT INTO gm_classified(panouid, heading, pitch, zoom, tags, userid) VALUES(?, ?, ?, ?, ?, ?)",
		[panoid, heading, pitch, zoom, JSON.stringify(tags), userid]);

	for (var i=0; i < tags.length; i++){
		db.query("INSERT INTO gm_tags VALUES(?, 1) ON DUPLICATE KEY UPDATE count = count + 1", tags[i]);
	}

	res.send("{result: \"ok\"}");
});

app.post("/editImageData", needsAuth, (req, res) => {
	var userid = req.user;

	var uid = req.body.uid;
	var tags = JSON.stringify(req.body.tags);
	var heading = req.body.heading;
	var pitch = req.body.pitch;
	var zoom = req.body.zoom;

	console.log(req.body);

	// this will prevent users from altering data they dont have access to
	db.query(`UPDATE gm_classified SET heading = ?, pitch = ?, zoom = ?, tags = ?
		WHERE uid = ? AND userid = ?;`, [heading, pitch, zoom, tags, uid, userid]);

	res.send("ok");
});

app.get("/getImage", needsAuth, (req, res) => {
	var userid = req.user;

	db.query(`
		SELECT * FROM gm_panos
		WHERE uid
		NOT IN (SELECT panouid FROM gm_classified WHERE userid = 0)
		ORDER BY RAND() LIMIT 1;`,
		[userid], function(err, r, fields){

		if (r != null && r.length > 0)
			res.send(JSON.stringify(r[0]));
		else
			res.send("{}");
	});
});

app.get("/loadTags", needsAuth, (req, res) => {
	db.query("SELECT * FROM gm_tags ORDER BY count DESC", function(err, r, fields){
		res.send(JSON.stringify(r));
	});
});

app.get("/getUser", needsAuth, (req, res) => {
	db.query("SELECT * FROM gm_users WHERE uid = ?", req.user, function(err, r, fields){
		res.send(JSON.stringify(r[0]));
	});
});

app.listen(config.webserver.port);

//53.777106, -1.647789

// 53.791171, -1.675374
// 53.791518, -1.673239

// 53.778954, -1.642323
// 53.781192, -1.637999

// 53.2603968142884,-0.212982756231167
// 53.2656974420586,-0.206763872137379

// 53.2653781902009 -0.016343424082159
// 53.2661766459638 -0.0103083374804581