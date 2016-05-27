// modules
var storage = require('node-persist');

// constants
var LAST_WINDOW_TIME = 'lastWindowTime';

// initialization
storage.initSync({
    dir:'/tmp/pervasiveid_store',
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    continuous: true,
    interval: false
});


var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'control123!',
  database : 'testpervasive'
});

// main
connection.connect();

var lastWindowTimestamp = storage.getItemSync(LAST_WINDOW_TIME);
// handle case for first time

console.log("proccessing tags since: " + new Date(lastWindowTimestamp));


connection.query('SELECT tagid, zone FROM tags where timestamp >= ' + lastWindowTimestamp, function(err, rows, fields) {
  if (err) throw err;

  connection.end();
  storage.setItemSync(LAST_WINDOW_TIME, new Date().getTime());
  // process rows

  var i;
  // get unique tag ids
  var tags = [];
  rows.forEach(function (row) {
  	if(tags.indexOf(row.tagid) < 0) {
  		tags.push(row.tagid);
  	}
  });

  var tag_zone_changes = [];

  // process tags one by one
  tags.forEach(function (tagid) {
  	console.log("Processing tag: "+ tagid);

  	// find last zone
  	var previous_zone = storage.getItemSync(tagid);
  	var new_zone = null;
  	console.log("previous zone: " + previous_zone);

  	rows.forEach(function(row){
  		if(row.tagid == tagid && row.zone !== previous_zone) {
  			new_zone = row.zone;
  		}
  	});

  	console.log("new zone: "+ new_zone);

  	if(new_zone !=null) {
  		tag_zone_changes.push({tagid:tagid, zone:new_zone});
  	}
  });

  console.log("Tag zone changes are:");
  console.log(tag_zone_changes);

  



});
