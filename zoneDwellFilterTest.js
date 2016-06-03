/*
 * 
 * A unit test for the ZoneDwellFilter
 * 
 */
var ZoneDwellFilter = require( "./zoneDwellFilter.js" );

var zdf = new ZoneDwellFilter();

var time;
var blink;
var loc;

function sleep( period )
{
	var t0 = new Date().getTime();
	var t1 = t0;
	while( t1 - t0 < period )
	{
		t1 = new Date().getTime();
	}
}

function getBlink( timestamp, x, y, zone )
{
	var b = {};
	b.time = timestamp;
	b.x = x;
	b.y = y;
	b.zone = zone;
	b.blink = {};
	return b;
}

time = new Date().getTime();
blink = getBlink( time, 10.0, 10.0, "z1" );
console.log( "SENDING " + JSON.stringify( blink ) );
loc = zdf.filter( "001", blink );
console.log( "IN: " + JSON.stringify( blink ) + " OUT:" + JSON.stringify( loc ) );

sleep( 500 );
time = new Date().getTime();
blink = getBlink( time, 11.0, 11.0, "z1" );
console.log( "SENDING " + JSON.stringify( blink ) );
loc = zdf.filter( "001", blink );
console.log( "IN: " + JSON.stringify( blink ) + " OUT:" + JSON.stringify( loc ) );

sleep( 500 );
time = new Date().getTime();
blink = getBlink( time, 50.0, 50.0, "z1" );
console.log( "SENDING " + JSON.stringify( blink ) );
loc = zdf.filter( "001", blink );
console.log( "IN: " + JSON.stringify( blink ) + " OUT:" + JSON.stringify( loc ) );

sleep( 500 );
time = new Date().getTime();
blink = getBlink( time, 51.0, 51.0, "z1" );
console.log( "SENDING " + JSON.stringify( blink ) );
loc = zdf.filter( "001", blink );
console.log( "IN: " + JSON.stringify( blink ) + " OUT:" + JSON.stringify( loc ) );

sleep( 500 );
time = new Date().getTime();
blink = getBlink( time, 56.0, 56.0, "z1" );
console.log( "SENDING " + JSON.stringify( blink ) );
loc = zdf.filter( "001", blink );
console.log( "IN: " + JSON.stringify( blink ) + " OUT:" + JSON.stringify( loc ) );

sleep( 500 );
time = new Date().getTime();
blink = getBlink( time, 60.0, 60.0, "z2" );
console.log( "SENDING " + JSON.stringify( blink ) );
loc = zdf.filter( "001", blink );
console.log( "IN: " + JSON.stringify( blink ) + " OUT:" + JSON.stringify( loc ) );

for( var i = 0; i < 10; i++ )
{
	sleep( 500 );
	console.log( "check dwell" );
	var out = zdf.checkDwellTime( new Date().getTime() );
	for( var j = 0; j < out.length; j++ )
	{
		console.log( "IN: " + JSON.stringify( out[j] ) + " OUT:" + JSON.stringify( out[j].blink ) );
	}
}

for( var i = 0; i < 15; i++ )
{
	sleep( 1000 );
	time = new Date().getTime();
	blink = getBlink( time, 80.0, 60.0, "z2" );
	console.log( "SENDING " + JSON.stringify( blink ) );
	loc = zdf.filter( "001", blink );
	console.log( "IN: " + JSON.stringify( blink ) + " OUT:" + JSON.stringify( loc ) );	
}
