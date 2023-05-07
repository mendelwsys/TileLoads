// import assert from 'node:assert/strict';
var assert = require('assert');
require('sqlite3').verbose();
var tape = require('tape');
var fs = require('fs');
const TileModule = require('./tileLoader');


var MBTiles = require('@mapbox/mbtiles');

var completed = { written: 0, read: 0 };
let mbTilePath=__dirname+'/mbtile/';
const pathPrefix=__dirname + '/kir_les_/';
if (!fs.existsSync(mbTilePath))
    fs.mkdirSync(mbTilePath,{ recursive: true });
if (!fs.existsSync(pathPrefix))
    fs.mkdirSync(pathPrefix,{ recursive: true });

new MBTiles(mbTilePath+'SecondT3.mbtiles?mode=ro', function(err, mbtiles)
{
    completed.open = true;
    completed.startFiles=0;
    if (err) throw err;

    z=[5,10];
    bbx=[
        [82,50],
        [103,71]
    ]

    this.ptUpLeft = TileModule.lonLat2Tile3857({x: bbx[0][0], y: bbx[1][1]})
    this.ptButtomRight = TileModule.lonLat2Tile3857({x: bbx[1][0], y: bbx[0][1]})


    for (let tz=z[0];tz<=z[1];tz++)
    {
        const totTiles = 1 << tz;
        const xStart = Math.floor(this.ptUpLeft.x * totTiles);
        const yStart = Math.floor(this.ptUpLeft.y * totTiles);

        const xStop = Math.floor(this.ptButtomRight.x * totTiles);
        const yStop = Math.floor(this.ptButtomRight.y * totTiles);


        for (let tx=xStart;tx<=xStop;tx++)
            for (let  ty=yStart;ty<=yStop;ty++)
            {
                const fName="kir_les_"+tz+"_"+ty+"_"+tx+".png";
                const coords=["",tz,tx,ty];
                const pathPrefixLocal=__dirname + '/kir_les_/'+coords[1];
                if (!fs.existsSync(pathPrefixLocal))
                    fs.mkdirSync(pathPrefixLocal,{ recursive: true });
                mbtiles.getTile(coords[1] | 0, coords[2] | 0, coords[3] | 0, function (err, tile)
                {
                    if (!err)
                    {
                        fs.writeFileSync(pathPrefixLocal+'/'+fName,tile);
                        completed.read++;
                    }
                    else
                        fs.writeFileSync(pathPrefixLocal+'/'+fName,"none");

                });
            }
    }
});
