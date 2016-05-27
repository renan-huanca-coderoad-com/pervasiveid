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
  host     : '10.100.1.99',
  user     : 'root',
  password : 'control123!',
  database : 'pervasid_retail'
});

function work(){

	// main
	connection.connect();

	var lastWindowTimestamp = storage.getItemSync(LAST_WINDOW_TIME);
	var endWindowsTime = lastWindowTimestamp + 10*60*1000;
	var processingTime = new Date(lastWindowTimestamp);
	
	// console.log("proccessing tags since: " + new Date(lastWindowTimestamp));
	var query = 'SELECT tag_id, zone_name FROM tag_reads_simple where time_stamp >= ' 
		+ lastWindowTimestamp
		+ ' and time_stamp < ' + endWindowsTime;
	// console.log('query: ' + query);
	// console.log('query started at: ' + new Date());

	connection.query(query, function(err, rows, fields) {
	  // console.log('query finished at: ' + new Date());
	  // console.log('rows returned :' + rows.length);
	  if (err) throw err;

	  connection.end();

	  storage.setItemSync(LAST_WINDOW_TIME, endWindowsTime);

	  // process rows
	  var i;
	  // get unique tag ids
	  var tags = {};
	  rows.forEach(function (row) {
	  		tags[row.tag_id] = row.zone_name;
	  });

	  var count = 0;
	  for (var tagid in tags) {
	    if (tags.hasOwnProperty(tagid)) {
	       ++count;
	    }
	  }
	  
	  var tag_zone_changes = [];

	  // process tags one by one
	  for (var tagid in tags) {
	  	// console.log("----------------------------");
	  	// console.log("Processing tag: "+ tagid);

	  	// find last zone
	  	var previous_zone = storage.getItemSync(tagid);
	  	var new_zone = null;

	  	if(previous_zone == null) {
	  		new_zone = tags[tagid];
	  	} else if (tags[tagid] != previous_zone) {
	  		new_zone = tags[tagid];
	  	}

	  	if(new_zone !=null) {
	  		storage.setItemSync(tagid, new_zone);
	  		tag_zone_changes.push({tagid:tagid, zone:new_zone});
	  	}
	  }

	  console.log(processingTime.toISOString()+"," + tag_zone_changes.length);	  
	});
}

work();
