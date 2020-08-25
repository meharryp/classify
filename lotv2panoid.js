/* this script should be run serverside to import all life on the verge data
   into a database to be classified. this script will delete all existing panoids
   in the database so run it before manually adding any extra routes. */

const {Client, Status} = require("@googlemaps/google-maps-services-js");
const mysql = require("mysql");
const toGeoJSON = require("togeojson");
const fs = require("fs");
const fetch = require("node-fetch");
const DOMParser = require("xmldom").DOMParser;
const config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));
const APIKEY = config.google.apikey;

if (!process.argv[2]){
	console.log("usage: lotv2panoid.js file.kml");
	return;
}

const kml = new DOMParser().parseFromString(fs.readFileSync(process.argv[2], "utf8"));
const data = toGeoJSON.kml(kml);
const client = new Client({});

var db = mysql.createConnection({
	host: config.mysql.host,
	user: config.mysql.user,
	password: config.mysql.password,
	database: config.mysql.database,
	port: config.mysql.port
});

var features = data.features;

var currentFeature = 0;
var completeCoordinates = 0;

function awaitNext(size){
	completeCoordinates++;

	if (completeCoordinates >= size){
		completeCoordinates = 0;
		getPanoid();
	}
}

process.stdout.write("Processing: 0/0");

function getPanoid(){
	if (features.length <= currentFeature){
		console.log(panoids);
		console.log("All panoids have been processed. Do not exit this program yet, items are still being written to database. The program will quit automatically when complete.")
		return;
	}

	process.stdout.cursorTo(12);
	process.stdout.write(currentFeature + "/" + features.length);

	currentFeature++;

	if (features[currentFeature].properties.Score == "<4"){
		getPanoid()
		return;
	}

	for (var i=0; i < features[currentFeature].geometry.coordinates.length; i++){
		fetch(`https://maps.googleapis.com/maps/api/streetview/metadata?location=${features[currentFeature].geometry.coordinates[i][1]},${features[currentFeature].geometry.coordinates[i][0]}&key=${APIKEY}`)
			.then(res => res.json())
			.then(json => {
				//console.log(json);
				awaitNext(features[currentFeature].geometry.coordinates.length);



				if (json.pano_id && json.date){
					var month = new Date(json.date).getMonth();

					if (month >= config.google.startmonth && month <= config.google.endmonth){
						db.query("INSERT INTO gm_panos(panoid, lotvscore, side) VALUES(?, ?, ?)", [json.pano_id, features[currentFeature].properties.Score, features[currentFeature].properties.Side], function(err, r, fields){});
					}
				}
			})
			.catch(error => {
				awaitNext(features[currentFeature].geometry.coordinates.length);
			});
	}
}

db.query("DROP TABLE gm_panos", function(){
	db.query(`CREATE TABLE gm_panos(
		uid INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
		panoid VARCHAR(64),
		lotvscore VARCHAR(16),
		side VARCHAR(8)
	)`, getPanoid);
})

/*
{ type: 'Feature',
  geometry:
   { type: 'LineString',
     coordinates:
      [ [Array],
        [Array],
        [Array],
        [Array],
        [Array],
        [Array],
        [Array],
        [Array],
        [Array] ] },
  properties:
   { stroke: '#ff0000',
     'stroke-opacity': 1,
     'fill-opacity': 0,
     CombiCode: 'Northern Lincolnshire Edge1101',
     Side: '',
     Score: '<4' } }
*/