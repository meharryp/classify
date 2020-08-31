# classify
Crowd-sourced image classification using data from Google Maps, and the [Lincolnshire Wildlife Trust's Life on the Verge project](https://www.lincstrust.org.uk/what-we-do/wildlife-conservation/projects/life-on-the-verge).

## Requirements
- NodeJS (>= 9.3.0)
- A MySQL Server

## Setup
- Clone the repo wherever you like
- Run npm install
- Open up config.json, set your MySQL details and Google API key, as well as the start and end date for images to be classifed
-- [You can find info on getting an API key here]
- Import KML data with `node lotv2panoid.js kmlfile.kml` (this will take a while)
-- The Life on the Verge project data is already included in the repo, named LOTVPolylines.kml
- Run `node app` to start the webserver
- The default username and password is `admin/password`
-- **Make sure to change this ASAP!!!!**
- Done! Add some new users and you'll be able to get classifying.
