var timestamp = msg.payload;

var storage = global.get('storage');
// STEP 1: get the zoneChangeFilter
var zcf = global.get('zoneChangeFilter');
// STEP 2: set the 'storage'
zcf.setStorage( storage );

node.warn( "storage=" + storage );
node.warn( "zcf=" + zcf );

var blinkArray = []

blinkArray.push( {
            	tagid: "001",
            	zone: "salesfloor",
            	timestamp: timestamp
            } );

//TODO: chunk this !
//for( each chunk )
{
    // STEP 3: call the filter
    var value = zcf.filter( blinkArray, 15 * 1000 )
    // TODO: move the persistHistory() call to AFTER the message has been sucessfully posted !
    // STEP 4: persist the blinkHistory map
    zcf.persistHistory();
}


msg.value = value;

return msg;
