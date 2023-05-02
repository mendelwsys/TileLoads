const https = require('https');
const http = require('http');
const fs = require('fs');
const Stream = require('stream').Transform;

const sradiusa=6378137
const sradiusb=6356752
let fEncoding = 'utf-8';

const dateString=function ()
{
    let date_ob = new Date();
// current date
// adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);
// current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
// current year
    let year = date_ob.getFullYear();
// current hours
    let hours = date_ob.getHours();
// current minutes
    let minutes = date_ob.getMinutes();
// current seconds
    let seconds = date_ob.getSeconds();
    return year + "." + month + "." + date;
}

const lonLat2Tile3395 = function(pt)
{

        let VRadiusA = sradiusa;
        let VRadiusB = sradiusb;
        let FExct=Math.sqrt(VRadiusA * VRadiusA - VRadiusB * VRadiusB) / VRadiusA;

        let res={};
        res.x = (0.5 + pt.x / 360);
        z = Math.sin(pt.y * Math.PI / 180);
        c = (1 / (2 * Math.PI));
        res.y = (0.5 - c * (Math.atanh(z) - FExct * Math.atanh(FExct * z)));
        return res;
    }

const lonLat2Tile3857 = function(pt)
{
        let res={};
        res.x = 0.5 + pt.x / 360;
        let z = Math.sin(pt.y * Math.PI / 180);
        let c = 1 / (2 * Math.PI);
        res.y = 0.5 - 0.5 * Math.log((1 + z) / (1 - z)) * c;
        return res;
    }

const simpleConverter = function(pt)
{
        let res={};
        res.x = (0.5 + pt.x / 360);
        res.y = (0.5 - pt.y / 360);
        return res;
}

const saveDescriptor2File=function(desc)
{
    let path = __dirname + '/'+desc.files.prefix;
    if (!fs.existsSync(path))
        fs.mkdirSync(path,{ recursive: true });
    desc.files.sfConverter=desc.files.fConverter.toString();
    desc.files.sfCreateUrl=desc.files.fCreateUrl.toString();
    //eval("desc.files.fCreateUrl2="+desc.files.sfCreateUrl);
    let _tileLoader;
    if (desc.tileLoader!==undefined)
    {
        _tileLoader= desc.tileLoader;
        delete desc.tileLoader;
    }

    fs.writeFileSync(path+'/taskDesc.json', JSON.stringify(desc, null, 2) , fEncoding);
    if (_tileLoader!==undefined)
        desc.tileLoader=_tileLoader;
}

const TileLoader=function
(
        desc
) {
    this.desc = desc;
    let bbx = {};
    this.desc.polygon.forEach(
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

    this.ptUpLeft = this.desc.files.fConverter({x: bbx.xmin, y: bbx.ymax})
    this.ptButtomRight = this.desc.files.fConverter({x: bbx.xmax, y: bbx.ymin})
    this.errMap = {totErrs:0,};


    this.saveErrMap2File=function ()
    {
        let path = __dirname + '/'+this.desc.files.prefix;
        if (!fs.existsSync(path))
            fs.mkdirSync(path,{ recursive: true });
        fs.writeFileSync(path+'/errMap.json', JSON.stringify(this.errMap.totErrs, null, 2) , fEncoding);
    }

    this.getTilesByErrMap=function (tz,errMap)
    {
        const retTiles=[];
        let errTiles=errMap[tz]
        if (errTiles!=null)
            errTiles.forEach( (el)=>{
                retTiles[retTiles.length]=el.tile;
            })
        return retTiles;
    }

    this.push2ErrMap=function(tile, err)
    {
        if (this.errMap[tile.z] === undefined)
            this.errMap[tile.z] = [];
        this.errMap[tile.z].push({tile: tile, err: err});
        this.errMap.totErrs+=1;
    }

    this.getNextTile=function(arrTiles)
    {
        const tix = Math.floor(Math.random() * arrTiles.length);
        const _tile = arrTiles[tix];
        arrTiles.splice(tix, 1)
        return _tile;
    }

    this.startLoading = function
        (
            callBack,
            pErrMap
        )
    {
        if(arguments.length===1)
        {
            if (typeof callBack === 'function')
                this.callBack = callBack;
            else
                this.pErrMap = callBack;
        }
        else
        {
            this.callBack = callBack;
            this.pErrMap = pErrMap;

        }
        this.startLoadTz(this.desc.zoom[0]);
    }

    this.currentZoom=-1;
    this.startLoadTz = function (tz)
    {
        const _oThisRef=this;

        if (tz<=this.currentZoom)
            return;
        if (tz>this.desc.zoom[1])
        {
            this.currentZoom=tz;
            if (this.callBack!==undefined)
            {
                setImmediate(function () {
                    _oThisRef.callBack();
                })
            }
            return;
        }
        this.desc.date=dateString();
        this.currentZoom=tz;

        const totTiles=1<<tz;
        const xStart=Math.floor(this.ptUpLeft.x*totTiles);
        const yStart=Math.floor(this.ptUpLeft.y*totTiles);

        const xStop=Math.floor(this.ptButtomRight.x*totTiles);
        const yStop=Math.floor(this.ptButtomRight.y*totTiles);


        let arrTiles=[];
        if (this.pErrMap===undefined)
        {
            for (let tx=xStart;tx<=xStop;tx++)
                for (let ty=yStart;ty<=yStop;ty++)
                    arrTiles[arrTiles.length]={z:tz,x:tx,y:ty};
        }
        else
        {
            arrTiles=this.getTilesByErrMap(tz,this.pErrMap);
            if (arrTiles.length===0)
            {
                setImmediate(function ()
                {
                    _oThisRef.startLoadTz(tz+1);
                })
                return;
            }
        }



        let n=0;
        while (arrTiles.length>0 && n<4)
        {
            const _tile = this.getNextTile(arrTiles);
            this.getTile(_tile,arrTiles);
            n++;
        }
    }



    this.getTile =  function (tile,arrTiles)
    {
        const _oThisRef=this;
        const _url=this.desc.files.fCreateUrl(tile);
        const url = new URL(_url);

        const isHttps = url.protocol.startsWith("https");
        const options =
        {
            hostname: url.hostname,
            port: (url.port==null || url.port==="")?(isHttps?443:80):parseInt(url.port),
            path: url.pathname,
            method: 'GET',
            timeout: 6000,
            headers: {
                'Accept':desc.files.options.constructorOptions.format,
                'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
            }
        }

        const requester=isHttps?https:http;
        requester.get(options, (res) =>
        {

            if (res.statusCode !== 200)
            {
                // console.error(`Did not get an OK from the server. Code: ${res.statusCode}`);
                this.push2ErrMap(tile, res.statusCode);
                res.resume();
                return;
            }

            let data = new Stream();
            res.on('error',(err)=>
                {
                    this.push2ErrMap(tile, err);
                }
            )
            res.on('data', (chunk) => {
                data.push(chunk);
            });

            res.on('close', () =>
            {
                let path = __dirname + '/'+this.desc.files.prefix+'/'+tile.z+'/';

                if (!fs.existsSync(path))
                    fs.mkdirSync(path,{ recursive: true });
                fs.writeFileSync(path+this.desc.files.prefix+tile.z+'_'+tile.x+'_'+tile.y+'.png',data.read());

                if (arrTiles.length===0)
                {
                    setTimeout(function ()
                    {
                        _oThisRef.startLoadTz(tile.z+1);
                    }, this.desc.files.nextScaleDelay);
                }
                else
                {
                    const _tile = this.getNextTile(arrTiles);
                    setTimeout(function ()
                    {
                        _oThisRef.getTile(_tile,arrTiles);
                    }, this.desc.files.nextTileDelay);
                }
            });
        });
    }
}

module.exports={
    sradiusa,
    sradiusb,
    fEncoding,
    dateString,
    saveDescriptor2File,
    TileLoader,
    lonLat2Tile3395,
    lonLat2Tile3857,
    simpleConverter
}
