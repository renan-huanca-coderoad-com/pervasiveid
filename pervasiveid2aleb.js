// modules
const storage = require('node-persist');
const mysql = require('mysql');
const fs = require('fs');
var request = require('request');


// constants
var LAST_WINDOW_TIME = 'lastWindowTime';
var TAGS_MAP = 'tagsmap';
var DEFAULT_STARTTIME = 1462173000000;
var LAST_DETECT_THRESHOLD = 6 * 3600 * 1000; // 6 hours
var DEFAULT_WINDOWS_SIZE = 10 * 60 * 1000;


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
    host: '10.100.0.39',
    user: 'root',
    password: 'control123!',
    database: 'pervasid_retail',
    port: 3307
});

var params = {
	out: null,
	threshold: LAST_DETECT_THRESHOLD,
	windows_size: DEFAULT_WINDOWS_SIZE,
	aleBridgeUrl: null
}

if(process.argv.length <= 2) {
	console.log("\tnode pervasiveidxml.js -o <folder> -t <last detect time [t]hreshold in mins> -w time [w]indow size in mins");
	return;
}

var indexParam;
for(indexParam = 2; indexParam < process.argv.length; indexParam++)
{
	if(process.argv[indexParam] === "-o") {
		params.out = process.argv[indexParam + 1]; 
	} else if(process.argv[indexParam] === "-t") {
		params.threshold = parseInt(process.argv[indexParam + 1]) * 60 * 1000; 
	} else if(process.argv[indexParam] === "-w") {
		params.windows_size = parseInt(process.argv[indexParam + 1]) * 60 * 1000; 
	} else if(process.argv[indexParam] === "-a") {
		params.aleBridgeUrl = process.argv[indexParam + 1]; 
	}
}

function read_zone_changes(cb) {
	var tagsmap = storage.getItemSync(TAGS_MAP);
	if(tagsmap == null) {
		tagsmap = {};
	}

    connection.connect();

    var lastWindowTimestamp = storage.getItemSync(LAST_WINDOW_TIME);
    if(!lastWindowTimestamp) {
    	lastWindowTimestamp = DEFAULT_STARTTIME;
    }

    var endWindowsTime = lastWindowTimestamp + params.windows_size;
    var processingTime = new Date(lastWindowTimestamp);

    // console.log("proccessing tags since: " + new Date(lastWindowTimestamp));
    var query = 'SELECT tag_id, zone_name, time_stamp FROM tag_reads_simple'+
    	' where time_stamp >= ' + lastWindowTimestamp +' and time_stamp < ' + endWindowsTime +
        ' order by time_stamp';

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
            // tags[row.tag_id] = row.zone_name;
            tags[row.tag_id] = {
            	zone: row.zone_name,
            	timestamp: row.time_stamp
            };
        });

        var count = 0;
        for (var tagid in tags) {
            if (tags.hasOwnProperty(tagid)) {
                ++count;
            }
        }

        var tag_zone_changes = [];

        // process tags one by one
        var zoneChangesCount = 0;
        var lastDetectChangesCount = 0;
        for (var tagid in tags) {

            // find last zone
            //var previous_zone = tagsmap[tagid];
            var taginfo = tagsmap[tagid];
			var new_zone = null;
			var previous_zone = null;

            if(taginfo != null) {
            	previous_zone = tagsmap[tagid].zone;
            }
            
            if (previous_zone == null) {
                new_zone = tags[tagid].zone;
            } else if (tags[tagid].zone != previous_zone) {
                new_zone = tags[tagid].zone;
            }

            var send = false;

            if(new_zone != null) {
            	zoneChangesCount++;
            	send = true;
            } else if(tags[tagid].timestamp - tagsmap[tagid].timestamp > params.threshold) {
            	lastDetectChangesCount++;
            	send = true;
            }

            if (send) {
                tagsmap[tagid] = {
                	zone: new_zone,
                	timestamp: tags[tagid].timestamp
                };

                tag_zone_changes.push({
                    tagid: tagid,
                    zone: new_zone
                });
            }
        }
        storage.setItemSync(TAGS_MAP, tagsmap);
        cb(null, {
        	tagCounts: count,
        	zoneChangesCount: zoneChangesCount,
        	lastDetectChangesCount: lastDetectChangesCount,
            datetime: processingTime,
            tagzones: tag_zone_changes
        });
    });
}

var t0 = new Date().getTime();

read_zone_changes(function(err, tagchanges) {
	var timestamp_str = new Date(tagchanges.datetime).toISOString(); 
	var header = fs.readFileSync('header.xml','utf-8').toString();
	var footer = fs.readFileSync('footer.xml','utf-8').toString();
	footer = footer.replace('__COUNT__', tagchanges.tagzones.length);
	var outfile = params.out + '/' + timestamp_str + '.xml';  

	// start to write xml
	// console.log(header);	
	fs.appendFileSync(outfile, header);
	tagchanges.tagzones.forEach(function(tagzone){
		var item_start = '<member ale_mojix_ext:direction="in" ale_mojix_ext:ts="'+
			timestamp_str +
			'" ale_mojix_ext:logicalReader="'+
			tagzone.zone+'">\n';
		var item_body = '<rawHex>urn:epc:raw:96.'+tagzone.tagid+'</rawHex>\n';
		var item_end = '</member>\n';
		fs.appendFileSync(outfile, item_start);
		fs.appendFileSync(outfile, item_body);
		fs.appendFileSync(outfile, item_end);
	});
	fs.appendFileSync(outfile, footer);
	var t1 = new Date().getTime();
	var secs = (t1 - t0)/ 1000;
	var stats = fs.statSync(outfile);
	var fileSizeInBytes = stats["size"];
	console.log(timestamp_str+", "+ 
		secs + ", " + 
		tagchanges.tagCounts + ", " + 
		tagchanges.tagzones.length + ", " + 
		tagchanges.zoneChangesCount+ ", " + 
		tagchanges.lastDetectChangesCount+ ", " +
		(fileSizeInBytes/(1024*1024)).toFixed(2) + " MB");

	if(params.aleBridgeUrl != null) {
		var formData = {
			file: fs.createReadStream(outfile)
		};

		request.post({url:params.aleBridgeUrl, formData: formData}, function (err, httpResponse, body) {
		  if (err) {
		    return console.error('upload failed:', err);
		  }
		  console.log('Upload successful!');
		});
	}
});