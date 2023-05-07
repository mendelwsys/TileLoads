// import assert from 'node:assert/strict';
// var assert = require('assert');
require('sqlite3').verbose();
var tape = require('tape');
var fs = require('fs');
var MBTiles = require('@mapbox/mbtiles');

// const nmFTiles='kirles_bg'
// const nmFTiles='kirles'
const nmFTiles='RosReestr_bg';

const mbtilesModeRwc = nmFTiles;
const startImgWith = 'RASTER_'+nmFTiles+'_';

const completed = { written: 0, read: 0 };
const mbTilePath=__dirname+'/mbtile/';
if (!fs.existsSync(mbTilePath))
    fs.mkdirSync(mbTilePath,{ recursive: true });


new MBTiles(mbTilePath+ mbtilesModeRwc + '.mbtiles?mode=rwc', function(err, mbtiles)
{
    completed.open = true;
    completed.startFiles=0;
    if (err) throw err;

    let pathPrefix=__dirname + '/' + startImgWith + '/';
    mbtiles.startWriting(function (err) {
        completed.started = true;
        if (err) throw err;
        fs.readdirSync(pathPrefix).forEach(insertFolder);

        var myf=function ()
        {
            if (completed.written === completed.startFiles)
            {

                var exampleInfo = {
                    name: nmFTiles,
                    description:nmFTiles+" tiles",
                    tile_format:"PNG",
                    scheme: 'xyz',
                    version: "1",
                    // minzoom: 13,
                    // maxzoom: 16,
                    center: [48,17,6],
                    bounds: [82,50,103,71],
                    // type:"baselayer",
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
        // let regExpStr = "^"+startImgWith+"(\\d+)_(\\d+)_(\\d+)\\.png$";
        let regExpStr = "^"+startImgWith+"(\\d+)_(\\d+)_(\\d+)\\.jpg$";
        let regExp = new RegExp(regExpStr);
        var coords = file.match(regExp);

        // var coords = file.match(/^RASTER_kirles_bg_(\d+)_(\d+)_(\d+)\.png$/);
        // var coords = file.match(/^RASTER_kirles_(\d+)_(\d+)_(\d+)\.png$/);

        if (!coords) return;

        var tile = fs.readFileSync(pathPrefix+'/' + file);
        completed.startFiles++;
        mbtiles.putTile(coords[1] | 0, coords[3] | 0, coords[2] | 0,            tile,
                function (err) {
            if (err) throw err;
            completed.written++;
        });
    }

});
