// import assert from 'node:assert/strict';
var assert = require('assert');
require('sqlite3').verbose();
var tape = require('tape');
var fs = require('fs');

var MBTiles = require('@mapbox/mbtiles');

var completed = { written: 0, read: 0 };
new MBTiles(__dirname+'/mbtile/tstfile.mbtiles?mode=rwc', function(err, mbtiles)
{
    completed.open = true;
    if (err) throw err;

    mbtiles.startWriting(function (err) {
        completed.started = true;
        if (err) throw err;

        fs.readdirSync(__dirname + '/RASTER_msk_/15/').forEach(insertTile);
    });

    function insertTile(file)
    {
        var coords = file.match(/^RASTER_msk_(\d+)_(\d+)_(\d+).png$/);
        if (!coords) return;

        // Flip Y coordinate because file names are TMS, but .putTile() expects XYZ.
        // coords[2] = Math.pow(2, coords[3]) - 1 - coords[2];

        var tile = fs.readFileSync(__dirname + '/RASTER_msk_/15/' + file);
        // mbtiles.putTile(coords[3] | 0, coords[1] | 0, coords[2] | 0,
        mbtiles.putTile(coords[1] | 0, coords[2] | 0, coords[3] | 0,            tile,

                function (err) {
            if (err) throw err;
            completed.written++;
            if (completed.written === 6) {
                mbtiles.stopWriting(function (err)
                {
                    completed.stopped = true;
                    if (err) throw err;
                    // verifyWritten();
                });
            }
        });
    }
    function verifyWritten() {
        fs.readdirSync(__dirname + '/RASTER_msk_/15/').forEach(function(file) {
            var coords = file.match(/^RASTER_msk_(\d+)_(\d+)_(\d+).png$/);
            if (coords) {
                // Flip Y coordinate because file names are TMS, but .getTile() expects XYZ.
                coords[2] = Math.pow(2, coords[3]) - 1 - coords[2];
                mbtiles.getTile(coords[3] | 0, coords[1] | 0, coords[2] | 0, function(err, tile) {
                    if (err) throw err;
                    assert.deepEqual(tile, fs.readFileSync(__dirname + '/RASTER_msk_/15/' + file));
                    completed.read++;
                    if (completed.read === 6) assert.end();
                });
            }
        });
    }
});
