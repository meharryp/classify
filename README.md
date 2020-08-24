# classify
Crowd-sourced image classification using data from Google Maps, and the [Lincolnshire Wildlife Trust's Life on the Verge project](https://www.lincstrust.org.uk/what-we-do/wildlife-conservation/projects/life-on-the-verge).

## Setup
Modify config.json to your liking, and import any KML data you wish to be classified using `node lotv2panoid.js kmlfile.kml`. `node app` will start the webserver.

After everything is first setup, the only account you will be able to login to is the admin account. The default username and password is admin/password. **Change this password ASAP!!** The admin account is then able to add new users.
