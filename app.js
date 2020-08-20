// http://live-twt-d8-lincolnshire.pantheonsite.io/sites/default/files/2018-05/roadside_reserves.pdf

const {Client, Status} = require("@googlemaps/google-maps-services-js");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const express = require("express");
const mysql = require("mysql");
const config = JSON.parse(require("fs").readFileSync(__dirname + "/config.json"));

const APIKEY = config.google.apikey;

const client = new Client({});
const app = express();

app.use(bodyParser.json())
app.use(express.static("res"))

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
		panoid VARCHAR(64),
		lotvscore VARCHAR(16)
	)`);

	db.query(`CREATE TABLE IF NOT EXISTS gm_classified(
		uid INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
		panoid VARCHAR(64) NOT NULL,
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
		username VARCHAR(32),
		password TEXT,
		admin INT NOT NULL DEFAULT 0
	)`)
});
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

app.get("/", (req,  res) => {
	res.send("check if logged in, shows either login page or home page");
});

app.get("/classify", (req, res) => {
	res.sendFile(__dirname + "/res/classify.html");
});

app.get("/me", (req, res) => {
	res.sendFile(__dirname + "/res/me.html");
});

app.get("/edit", (req, res) => {
	res.sendFile(__dirname + "/res/edit.html");
});

app.get("/help", (req, res) => {
	res.sendFile(__dirname + "/res/help.html");
});

app.post("/nearestRoad", (req, res) => {
	GetRoadside(req.body.path, data => {
		res.send(data);
	});
});

app.post("/snapToRoads", (req, res) => {
	console.log(req.body);
	SnapToRoads(req.body.path, data => {
		res.send(data);
	})
});

app.get("/generateImage", (req, res) => {
	res.send([
		"https://maps.googleapis.com/maps/api/streetview?pano=" + req.query.pano + "&size=1280x720&heading=" + req.query.heading + "&fov=" + req.query.fov + "&pitch=" + req.query.pitch + "&key=" + APIKEY,
		"https://maps.googleapis.com/maps/api/streetview?pano=" + req.query.pano + "&size=1280x720&heading=" + req.query.heading + "&fov=" + req.query.fov + "&pitch=" + req.query.pitch + "&key=" + APIKEY
	]);
});

app.get("/inputCoords", (req, res) => {
	res.sendFile(__dirname + "/res/coords.html")
});

app.get("/getClassified", (req, res) => {
	var userid = 0;

	db.query("SELECT * FROM gm_classified WHERE userid = ?", [userid], function(err, r, fields){
		res.send(JSON.stringify(r));
	});
});

app.get("/getClassified/:uid", (req, res) => {
	db.query("SELECT * FROM gm_classified WHERE uid = ?", [req.params.uid], function(err, r, fields){
		res.send(JSON.stringify(r[0]));
	});
});

app.post("/saveCoords", (req, res) => {
	var ids = req.body.data;

	for (var i=0; i < ids.length; i++){
		db.query("INSERT INTO gm_panos VALUES(?)", [ids[i]]);
	}
});

app.post("/saveImageData", (req, res) => {
	var userid = 0;

	var panoid = req.body.panoid;
	var tags = JSON.stringify(req.body.tags);
	var heading = req.body.heading;
	var pitch = req.body.pitch;
	var zoom = req.body.zoom;

	db.query("INSERT INTO gm_classified(panoid, heading, pitch, zoom, tags, userid) VALUES(?, ?, ?, ?, ?, ?)",
		[panoid, heading, pitch, zoom, tags, userid]);

	for (var i=0; i < tags.length; i++){
		db.query("INSERT INTO gm_tags VALUES(?, 1) ON DUPLICATE KEY UPDATE count = count + 1", tags[i]);
	}

	res.send("{result: \"ok\"}");
});

app.post("/editImageData", (req, res) => {
	var userid = 0;

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

app.get("/getImage", (req, res) => {
	var userid = 0;

	db.query(`
		SELECT panoid, lotvscore FROM gm_panos
		WHERE panoid
		NOT IN (SELECT panoid FROM gm_classified WHERE userid = ?)
		GROUP BY panoid
		ORDER BY RAND() LIMIT 1;`,
		[userid], function(err, r, fields){

		if (r != null && r.length > 0)
			res.send(JSON.stringify(r[0]));
		else
			res.send("{}");
	});
});

app.get("/loadTags", (req, res) => {
	var userid = 0;

	db.query("SELECT * FROM gm_tags ORDER BY count DESC", function(err, r, fields){
		res.send(JSON.stringify(r));
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