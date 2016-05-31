/**
 * A simple Zone Name Change filter, that leaks lastDetects.
 * 
 * A array of the current set of blinks:
 * 
 * blinkArray[index].tagid
 * blinkArray[index].timestamp
 * blinkArray[index].zone
 * 
 * A map of the set of blinks from persistent storage:
 * 
 * blinkHistoryMap[tagid].timestamp
 * blinkHistoryMap[tagid].zone
 * 
 * threshold - the threshold value in milliseconds for leaking lastDetect records
 * 
 * NOTE: blinkHistoryMap is modified, so make sure you pesist it after calling this method !
 * 
 */

var storageKey = 'tagsmap';
var storage;
/*
 * A map of the set of blinks from persistent storage:
 * 
 * blinkHistoryMap[tagid].timestamp
 * blinkHistoryMap[tagid].zone
 */
var blinkHistoryMap;

module.exports = {
		
setStorage: function( _storage )
{
	storage = _storage;
},

/*
 * A array of the current set of blinks:
 * 
 * blinkArray[index].tagid
 * blinkArray[index].timestamp
 * blinkArray[index].zone
 *  
 * threshold - the threshold value in milliseconds for leaking lastDetect records
 * 
 * NOTE: blinkHistoryMap is modified, so make sure you pesist it after calling this method !
 */
filter: function( blinkArray, threshold )
{
	var value = new Object();

	value.tagZoneChanges = [];
	// count = zoneChangeCount + lastDetectCount + dropCount
	value.count = 0;
	value.zoneChangeCount = 0;
	value.lastDetectCount = 0;
	value.dropCount = 0;
	
	blinkHistoryMap = storage.getItemSync( storageKey );
	if( blinkHistoryMap == null )
	{
	    blinkHistoryMap ={};
	}
	
	for( var i = 0; i <  blinkArray.length; i++ )
	{
		var tagid = blinkArray[i].tagid;
		
		var send = false;

		// case 1: send if first blink or zone name is not equal to last zone name
		if( blinkHistoryMap[tagid] == null || blinkHistoryMap[tagid].zone != blinkArray[i].zone )
		{
			blinkHistoryMap[tagid] =
			{
				timestamp: blinkArray[i].timestamp,
				zone: blinkArray[i].zone
			};
			send = true;
			value.zoneChangeCount++;
		}
		// case 2: send if lastDetect time threshold has been execeded
		else if( blinkArray[i].timestamp - blinkHistoryMap[tagid].timestamp > threshold )
		{
			blinkHistoryMap[tagid] =
			{
				timestamp: blinkArray[i].timestamp,
				zone: blinkArray[i].zone
			};
			send = true;
			value.lastDetectCount++;
		}
		// case 3: drop this blink
		else
		{
			value.dropCount++;
		}

		if( send ) 
		{
			value.tagZoneChanges.push( {
				tagid: tagid,
				timestamp: blinkHistoryMap[tagid].timestamp,
				zone: blinkHistoryMap[tagid].zone
			} );
		}
		
		value.count++;
	}

	return value;
},

persistHistory: function()
{
	storage.setItemSync( storageKey, blinkHistoryMap );
}

}
