// modules
var storage = require('node-persist');
var mysql = require('mysql');
const fs = require('fs');

// constants
var LAST_WINDOW_TIME = 'lastWindowTime';
var DEFAULT_STARTTIME = 1462173000000;

// initialization
storage.initSync({
    dir: '/tmp/pervasiveid_store',
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    continuous: true,
    interval: false
});


var connection = mysql.createConnection({
    host: '10.100.1.99',
    user: 'root',
    password: 'control123!',
    database: 'pervasid_retail'
});

function read_zone_changes(cb) {
    // main
    connection.connect();

    var lastWindowTimestamp = storage.getItemSync(LAST_WINDOW_TIME);
    if(!lastWindowTimestamp) {
    	lastWindowTimestamp = DEFAULT_STARTTIME;
    }

    var endWindowsTime = lastWindowTimestamp + 10 * 60 * 1000;
    var processingTime = new Date(lastWindowTimestamp);

    // console.log("proccessing tags since: " + new Date(lastWindowTimestamp));
    var query = 'SELECT tag_id, zone_name FROM tag_reads_simple where time_stamp >= ' +
        lastWindowTimestamp +
        ' and time_stamp < ' + endWindowsTime;
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
        rows.forEach(function(row) {
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

            if (previous_zone == null) {
                new_zone = tags[tagid];
            } else if (tags[tagid] != previous_zone) {
                new_zone = tags[tagid];
            }

            if (new_zone != null) {
                storage.setItemSync(tagid, new_zone);
                tag_zone_changes.push({
                    tagid: tagid,
                    zone: new_zone
                });
            }
        }
        cb(null, {
            datetime: processingTime,
            tagzones: tag_zone_changes
        });
    });
}

read_zone_changes(function(err, tagchanges) {
	var header = fs.readFileSync('header.xml').toString();
	var footer = fs.readFileSync('footer.xml').toString();
	footer = footer.replace('__COUNT__', tagchanges.tagzones.length);

	// start to write xml
	console.log(header);	
	tagchanges.tagzones.forEach(function(tagzone){
		var item_start = '<member ale_mojix_ext:direction="in" ale_mojix_ext:ts="'+
			new Date(tagchanges.datetime).toISOString()+
			'" ale_mojix_ext:logicalReader="'+
			tagzone.zone+'">';
		var item_body = '<rawHex>urn:epc:raw:'+tagzone.tagid+'</rawHex>';
		var item_end = '</member>';
		console.log(item_start);
		console.log(item_body);
		console.log(item_end);
	});
	console.log(footer);
});