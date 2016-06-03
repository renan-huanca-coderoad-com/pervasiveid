/*
 * ZoneDwellFilter
 */ 

var method = ZoneDwellFilter.prototype;

function ZoneDwellFilter() 
{
    // distance limits for "pops"
    this.unlockDistance = 10.0;
    
    // distance limit is zone is the same
    this.inZoneDistance = 5.0;
    
    // dwellTime limit (in seconds)
    this.zoneDwellTime = 3.0;
    
    // dwellTime limit (in seconds)
    this.lastDetectTimeWindow = 5.0;
    
    // key=serialNumber
    this.map = {};
    
    // blinks waiting for dwellTime to elapse
    this.blinkqueue = {};
    
    this.epoch;
    
    this.firstBlinkTime;
}
  
// require fields: time, x, y, zone, blink
method.filter = function( serialNumber, thisBlink )
{
    // get data for this serialNumber
    var data = this.map[serialNumber];
    //console.log( "data=" + data );
    
    if( this.epoch === undefined )
    {
        this.epoch = new Date().getTime();
        this.firstBlinkTime = thisBlink.time;
        //console.log( "definining epoc" );
    }

    // 1. always send the first blink
    if( data == null )
    {
        data = {};
        this.map[serialNumber] = data;
        data.lastSent = thisBlink;
        data.lastBlink = thisBlink;
        data.zoneDwell = 0;
        return thisBlink;
    }

    // 2. DISTANCE RULE: send if distance exceeds some threshold
    if( this.unlockDistance > 0 )
    {
        var d = this.distance( data.lastSent, thisBlink );
        if( d >= this.unlockDistance )
        {
            //blinkqueue.remove( serialNumber );
            delete this.blinkqueue[serialNumber];
            data.lastSent = thisBlink;
            data.lastBlink = thisBlink;
            data.zoneDwell = 0;
            return thisBlink;
        }
    }

    // 3. ZONE-DISTANCE RULE: send if within the same zone AND the distance
    // between this blink
    // and the last sent blink exceeds the distance threshold
    if( this.inZoneDistance > 0 && thisBlink.zone == data.lastSent.zone )
    {
        var d = this.distance( data.lastSent, thisBlink );
        if( d >= this.inZoneDistance )
        {
            //blinkqueue.remove( serialNumber );
        	//console.log( "blinkqueue=" + this.blinkqueue[serialNumber] );
            delete this.blinkqueue[serialNumber];
            //console.log( "blinkqueue=" + this.blinkqueue[serialNumber] );
            data.lastSent = thisBlink;
            data.lastBlink = thisBlink;
            data.zoneDwell = 0;
            return thisBlink;
        }
    }

    // 4. LAST DETECT LEAK
    if( thisBlink.time - data.lastSent.time > 1000 * this.lastDetectTimeWindow )
    {
        delete this.blinkqueue[serialNumber];
        data.lastSent = thisBlink;
        data.lastBlink = thisBlink;
        data.zoneDwell = 0;
        return thisBlink;
    }

    if( thisBlink.zone == data.lastBlink.zone )
    {
        data.zoneDwell += thisBlink.time - data.lastBlink.time;
    }
    else
    {
        data.zoneDwell = 0;
    }

    this.blinkqueue[serialNumber] = thisBlink;

    data.lastBlink = thisBlink;

    return null;
}
    
method.checkDwellTime = function( now )
{
	var blinks = [];
    for( var serialNumber in this.blinkqueue )
    {
        var data = this.map[serialNumber];
        
        var dwellTime = data.zoneDwell + now - this.epoch + this.firstBlinkTime - data.lastBlink.time;
        
        if( dwellTime >= this.zoneDwellTime * 1000 && data.lastBlink.zone != data.lastSent.zone )
        {
            data.lastSent = data.lastBlink;
            data.zoneDwell = 0;
            delete this.blinkqueue[serialNumber];
            data.lastSent.blink.timestamp = now;
            blinks.push( data.lastSent );
        }
    }
    return blinks;
}

method.distance = function( l1, l2 )
{
    var delx = l1.x - l2.x;
    var dely = l1.y - l2.y;
    return Math.sqrt( delx * delx + dely * dely );
}
    
module.exports = ZoneDwellFilter;
