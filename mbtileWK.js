// import assert from 'node:assert/strict';
var assert = require('assert');
require('sqlite3').verbose();
var tape = require('tape');
var fs = require('fs');


var MBTiles = require('@mapbox/mbtiles');

var completed = { written: 0, read: 0 };
let mbTilePath=__dirname+'/mbtile/';
if (!fs.existsSync(mbTilePath))
    fs.mkdirSync(mbTilePath,{ recursive: true });

new MBTiles(mbTilePath+'tstfile.mbtiles?mode=rwc', function(err, mbtiles)
{
    completed.open = true;
    completed.startFiles=0;
    if (err) throw err;

    let pathPrefix=__dirname + '/RASTER_msk_/';
    mbtiles.startWriting(function (err) {
        completed.started = true;
        if (err) throw err;
        fs.readdirSync(pathPrefix).forEach(insertFolder);

        var myf=function ()
        {
            if (completed.written === completed.startFiles)
            {

                var exampleInfo = {
                    name: "moscow-world",
                    description:"moscow tiles",
                    tile_format:"PNG",
                    scheme: 'xyz',
                    version: "1",
                    // minzoom: 13,
                    // maxzoom: 16,
                    center: [4952.5,2561.5,13],
                    bounds: [37.6059,55.6394,37.6879,55.7867],
                    type: "overlay",
                    // "json": `{"vector_layers": [ { "id": "raster_moscow01", "description": "", "minzoom": 13, "maxzoom": 16, "fields": {} } ] }`
                };

                mbtiles.putInfo(exampleInfo, function(err)
                {
                    if (err) throw err;
                    mbtiles.stopWriting(function (err)
                    {
                        if (err) throw err;
                        completed.stopped = true;
                        // fs.readdirSync(pathPrefix).forEach(verifyFolder)
                    });
                });


            }
            else
                setTimeout( myf,10)
        }
        setTimeout( myf,10)

    });

    function insertFolder(folder)
    {
        let stat = fs.lstatSync(pathPrefix+folder);
        if (stat.isDirectory())
            fs.readdirSync(pathPrefix+folder).forEach
            (
                (file)=>
                {
                    insertTile(pathPrefix+folder,file)
                }
            );
    }
    function insertTile(pathPrefix,file)
    {
        var coords = file.match(/^RASTER_msk_(\d+)_(\d+)_(\d+).png$/);
        if (!coords) return;

        // Flip Y coordinate because file names are TMS, but .putTile() expects XYZ.
        // coords[2] = Math.pow(2, coords[3]) - 1 - coords[2];

        var tile = fs.readFileSync(pathPrefix+'/' + file);
        completed.startFiles++;
        mbtiles.putTile(coords[1] | 0, coords[2] | 0, coords[3] | 0,            tile,
                function (err) {
            if (err) throw err;
            completed.written++;
        });
    }

    function verifyFolder(folder)
    {
        let stat = fs.lstatSync(pathPrefix+folder);
        if (stat.isDirectory())
            fs.readdirSync(pathPrefix+folder).forEach
            (
                (file)=>
                {
                    verifyTile(pathPrefix+folder,file)
                }
            );
    }

    function verifyTile(folder,file)
    {
        var coords = file.match(/^RASTER_msk_(\d+)_(\d+)_(\d+).png$/);
        if (coords) {
            // Flip Y coordinate because file names are TMS, but .getTile() expects XYZ.
            // coords[2] = Math.pow(2, coords[3]) - 1 - coords[2];
            // mbtiles.getTile(coords[3] | 0, coords[1] | 0, coords[2] | 0, function(err, tile) {
            mbtiles.getTile(coords[1] | 0, coords[2] | 0, coords[3] | 0,  function(err, tile) {
                if (err) throw err;
                assert.deepEqual(tile, fs.readFileSync(folder+'/' + file));
                completed.read++;
                if (completed.read === completed.startFiles)
                    // assert.end();
                    console.log("Verify success")
            });
        }
    }

});
