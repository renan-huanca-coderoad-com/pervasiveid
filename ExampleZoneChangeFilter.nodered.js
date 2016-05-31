var timestamp = msg.payload;

var storage = global.get('storage');
// STEP 1: get the zoneChangeFilter
var zcf = global.get('zoneChangeFilter');
// 
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
    var value = zcf.filter( blinkArray, 15 * 1000 )
    // TODO: move the persistHistory() call to AFTER the message has been sucessfully posted !
    zcf.persistHistory();
}


msg.value = value;

return msg;

