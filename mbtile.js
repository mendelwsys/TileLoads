// import assert from 'node:assert/strict';
// var assert = require('assert'); //
require('sqlite3').verbose();

const tape = require('tape');
const fs = require('fs');
const MBTiles = require('@mapbox/mbtiles');

const completed =
    {
        written: 0, read: 0, tls:{},bbx:{},ixfT:[],
        startFiles:0,
        _4wrTotal:0,
        _passed:0
    };

const findFormat=/image\/(\w+)/;
const defLogMbCounter = 3000;//Выводить в лог состояние построения mbtile.
const defWriterCount = 100; //Кол-во потоков записи на дискю

const createMBTile=function(desc) {

    if (!desc.files)
        return;

    const bbx = {};
    desc.polygon.forEach(
        px => {
            if (bbx.xmin === undefined) {
                bbx.xmax = bbx.xmin = px[0];
                bbx.ymax = bbx.ymin = px[1];
            }

            bbx.xmax = Math.max(bbx.xmax, px[0])
            bbx.ymax = Math.max(bbx.ymax, px[1])

            bbx.xmin = Math.min(bbx.xmin, px[0])
            bbx.ymin = Math.min(bbx.ymin, px[1])
        }
    )
    completed.bbx=bbx;

    const mbTilePath = __dirname + '/mbtile/';
    if (!fs.existsSync(mbTilePath))
        fs.mkdirSync(mbTilePath, {recursive: true});

    const nmFTiles=desc.areaName;

    new MBTiles(mbTilePath + nmFTiles + '.mbtiles?mode=rwc', function (err, mbtiles)
    {
        completed.open = true;
        completed.startFiles = 0;
        completed._4wrTotal=0;
        completed._passed=0;
        completed.ixfT=[];

        if (err) throw err;


        mbtiles.startWriting(function (err)
        {
            completed.started = true;
            if (err) throw err;


            desc.files.forEach(
                (fileO)=>
                {
                    const pathPrefix = __dirname + '/' + fileO.prefix + '/';

                    fileO.ext='png';
                    const inFormat=fileO.options.constructorOptions.format;
                    if (inFormat)
                    {
                        const aExt=inFormat.match(findFormat)
                        if (aExt && aExt.length>1)
                            fileO.ext=aExt[1];
                    }
                    fs.readdirSync(pathPrefix).
                    forEach(
                        (folder)=>
                        {
                            insertFolder(pathPrefix,folder,fileO)
                        });
                });

            const isEndP = function ()
            {
                const bbx=completed.bbx;

                //if (completed.written === completed.startFiles)
                if (completed._passed === completed._4wrTotal)// || completed.ixf>=206540)
                {
                    const exampleInfo =
                    {
                        name: nmFTiles,
                        description: nmFTiles + " tiles",
                        // tile_format: "PNG",
                        scheme: 'xyz',
                        version: "1",
                        // minzoom: 13,
                        // maxzoom: 16,
                        // center: [48,17,6],
                        // bounds: [82,50,103,71],
                        // center: [4952.5, 2561.5, 13],
                        // bounds: [37.6059, 55.6394, 37.6879, 55.7867],
                        bounds:[bbx.xmin,bbx.ymin,bbx.xmax,bbx.ymax],
                        // type:"baselayer",
                        type: "overlay",
                        // "json": `{"vector_layers": [ { "id": "raster_moscow01", "description": "", "minzoom": 13, "maxzoom": 16, "fields": {} } ] }`
                    };

                    for (let tz in completed.tls)
                    {
                        const zTls=completed.tls[tz];
                        exampleInfo.center=[(zTls[0]+zTls[2])/2,(zTls[1]+zTls[3])/2,1*tz]
                        break;
                    }
                    mbtiles.putInfo(exampleInfo, function (err)
                    {
                        if (err) throw err;
                        mbtiles.stopWriting(function (err) {
                            if (err) throw err;
                            completed.stopped = true;
                        });
                    });
                } else
                    setTimeout(isEndP, 10)
            }
            setTimeout(isEndP, 10)
        });


        function nextFile(pathPrefix,folder,fileO,fTiles)
        {
            while (completed.ixfT[folder]<fTiles.length && (completed.written + defWriterCount > completed.startFiles))// && completed.ixf<206540)
            {

                let file=fTiles[completed.ixfT[folder]];
                completed.ixfT[folder]++;
                insertTile(pathPrefix + folder, file,fileO)
            }

            if (completed.ixfT[folder]<fTiles.length)// && completed.ixf<206540)
            {
                setTimeout(
                    function ()
                    {
                        nextFile(pathPrefix,folder,fileO,fTiles);
                    },5)
            }
        }


        function insertFolder(pathPrefix,folder,fileO)
        {
            let stat = fs.lstatSync(pathPrefix + folder);

            completed.ixfT[folder]=0;
            if (stat.isDirectory())
            {
                let fTiles=fs.readdirSync(pathPrefix + folder);
                completed._4wrTotal+=fTiles.length;
                nextFile(pathPrefix,folder,fileO,fTiles)
            }
                // forEach
                // (
                //     (file) =>
                //     {
                //         insertTile(pathPrefix + folder, file,fileO)
                //     }
                // );
        }

        function insertTile(pathPrefix, file,fileO)
        {
            let regExpStr = "^" + fileO.prefix + "(\\d+)_(\\d+)_(\\d+)\\."+fileO.ext+"$";
            const regExp = new RegExp(regExpStr);
            const coords = file.match(regExp);
            if (!coords)
            {
                completed._passed++;
                return;
            }


            let tile = fs.readFileSync(pathPrefix + '/' + file);
            completed.startFiles++;

            let refTile=completed.tls[1*coords[1]]
            if (!refTile)
                refTile=completed.tls[1*coords[1]]=[1*coords[3],1*coords[2],1+1*coords[3],1+1*coords[2]];

            refTile[0]=Math.min(refTile[0],1*coords[3]);
            refTile[1]=Math.min(refTile[1],1*coords[2]);
            refTile[2]=Math.max(refTile[2],1+1*coords[3]);
            refTile[3]=Math.max(refTile[3],1+1*coords[2]);

            mbtiles.putTile(coords[1] | 0, coords[3] | 0, coords[2] | 0, tile,
                function (err)
                {
                    if (err) throw err;
                    completed.written++;
                    completed._passed++;
                    if (completed.written%defLogMbCounter===0)
                    {
                        console.log("Scale:"+(coords[1] | 0)+" Total tiles in mbtile file: "+ completed.written+" of: "+completed._4wrTotal);
                    }
                });
        }
    });
}

module.exports={
    createMBTile
}