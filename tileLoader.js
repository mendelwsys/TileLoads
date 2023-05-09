const https = require('https');
const http = require('http');
const fs = require('fs');
const Stream = require('stream').Transform;

const sradiusa=6378137
const sradiusb=6356752
let fEncoding = 'utf-8';

const defNextScaleDelay=100;
const defNextTileDelay=10;
const testTimeOut = 100;
const findFormat=/image\/(\w+)/;
let waitDownLoadTimeOut = 10000;
let checkTimeout=500;
let defPauseBeforeNextAttempt=1000;

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

const createUrlSZYX=function (tile)
{
    let _url=this.url;
    if (this.serversPrefix)
    {
        let tix = Math.floor(Math.random() * this.serversPrefix.length);
        _url=_url.replaceAll('{s.}',this.serversPrefix[tix])
    }
    _url=_url.replaceAll("{z}",tile.z)
    _url=_url.replaceAll("{y}",tile.y)
    _url=_url.replaceAll("{x}",tile.x)
    return _url;
}

const getBBoxByTile=function (tile,_sradiusa,_sradiusb)
{

    if (!_sradiusa)
        _sradiusa=sradiusa;

    if (!_sradiusb)
        _sradiusb=_sradiusa;

    const totTile=1<<tile.z;
    const bbox=
        [
            [tile.x/totTile, tile.y/totTile],
            [(tile.x+1)/totTile,
                (tile.y+1)/totTile]]

    const wMul= 2*Math.PI * _sradiusa;
    const hMul= 2*Math.PI * _sradiusb;
    for (const pt of bbox)
    {
        pt[0]=(pt[0] - 0.5) * wMul;
        pt[1]= (0.5 - pt[1]) * hMul;
    }
    return bbox;
}


const createUrlBBox=function (tile)
{
    const bbox=getBBoxByTile(tile);
    let _url=this.url;
    _url=_url.replaceAll(
        "{bbox}",
        ""+Math.min(bbox[0][0],bbox[1][0])+","+Math.min(bbox[0][1],bbox[1][1])+","+
        Math.max(bbox[0][0],bbox[1][0])+","+Math.max(bbox[0][1],bbox[1][1])
    )
    return _url;
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

const saveDescriptor2File=function(desc,currentFIx)
{
    let path = __dirname + '/'+desc.files[currentFIx].prefix;
    if (!fs.existsSync(path))
        fs.mkdirSync(path,{ recursive: true });
    desc.files[currentFIx].sfConverter=desc.files[currentFIx].fConverter.toString();
    desc.files[currentFIx].sfCreateUrl=desc.files[currentFIx].fCreateUrl.toString();
    //eval("desc.files[currentFIx].fCreateUrl2="+desc.files[currentFIx].sfCreateUrl);
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
        desc,
        mode
) {


    this.desc = desc;
    if (!this.desc.files || !this.desc.files.length)
        return;

    this.mode=mode;

    this.totalReq=0;
    this.endReq=0;
    this.waitCont=0;

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

    this.currentZoom=[];
    this.errMap=[];
    this.ext=[];
    for (let ix=0;ix<this.desc.files.length;ix++)
    {
        this.currentZoom[this.currentZoom.length]=-1;
        this.errMap[this.errMap.length] = {totErrs:0};
        this.ext[this.ext.length]='png';
        const inFormat=this.desc.files[ix].options.constructorOptions.format;
        if (inFormat)
        {
            const aExt=inFormat.match(findFormat)
            if (aExt && aExt.length>1)
                this.ext[this.ext.length-1]=aExt[1];
        }
    }

    this.saveErrMap2File=function (currentFIx)
    {
        let path = __dirname + '/'+this.desc.files[currentFIx].prefix;
        if (!fs.existsSync(path))
            fs.mkdirSync(path,{ recursive: true });
        fs.writeFileSync(path+'/errMap.json', JSON.stringify(this.errMap[currentFIx].totErrs, null, 2) , fEncoding);
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

    this.push2ErrMap=function(tile, err,currentFIx)
    {
        if (this.errMap[currentFIx][tile.z] === undefined)
            this.errMap[currentFIx][tile.z] = [];
        this.errMap[currentFIx][tile.z].push({tile: tile, err: err});
        this.errMap[currentFIx].totErrs+=1;
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
        this.desc.date=dateString();
        this.startLoadTz(this.desc.files[0].zoom[0],0);
    }


    this.callCallBack = function ()
    {
        if (this.callBack !== undefined)
        {
            if (this.endReq === this.totalReq || this.waitCont*checkTimeout >= waitDownLoadTimeOut)
                setImmediate(() =>
                {
                    if (this.waitCont*checkTimeout >= waitDownLoadTimeOut)
                        this.callBack(this.waitCont);
                    else
                        this.callBack();
                })
            else
            {
                this.waitCont++;
                setTimeout(() => {
                    this.callCallBack();
                }, checkTimeout)
            }
        }
    }

    this.startLoadTz = function (tz,currentFIx)
    {

        if (tz<=this.currentZoom[currentFIx])
            return;

        if (tz>this.desc.files[currentFIx].zoom[1])
        {
            this.currentZoom[currentFIx]=tz;

            if (currentFIx<this.desc.files.length-1)
            {
                currentFIx++;
                tz=this.desc.files[currentFIx].zoom[0]
                setImmediate(()=>
                {
                    this.startLoadTz(tz,currentFIx);
                })
            }
            else
                this.callCallBack();
            return;
        }


        if (!this.desc.files[currentFIx].nextTileDelay)
            this.desc.files[currentFIx].nextTileDelay=defNextTileDelay;
        if (!this.desc.files[currentFIx].nextScaleDelay)
            this.desc.files[currentFIx].nextScaleDelay=defNextScaleDelay;

        this.currentZoom[currentFIx]=tz;

        this.ptUpLeft = this.desc.files[currentFIx].fConverter({x: bbx.xmin, y: bbx.ymax})
        this.ptButtomRight = this.desc.files[currentFIx].fConverter({x: bbx.xmax, y: bbx.ymin})

        const totTiles=(1<<tz);

        const xStart=Math.floor(this.ptUpLeft.x*totTiles);
        const yStart=Math.floor(this.ptUpLeft.y*totTiles);

        const xStop=Math.floor(this.ptButtomRight.x*totTiles);
        const yStop=Math.floor(this.ptButtomRight.y*totTiles);


        let arrTiles=[];
        if (this.pErrMap===undefined || this.pErrMap[currentFIx]===undefined)
        {
            for (let tx=xStart;tx<=xStop;tx++)
                for (let ty=yStart;ty<=yStop;ty++)
                    arrTiles[arrTiles.length]={z:tz,x:tx,y:ty};
        }
        else
        {
            arrTiles=this.getTilesByErrMap(tz,this.pErrMap[currentFIx]);
            if (arrTiles.length===0)
            {
                setImmediate(()=>
                {
                    this.startLoadTz(tz+1,currentFIx);
                })
                return;
            }
        }

        let reqCount=this.desc.files[currentFIx].reqCount;
        if (!reqCount)
            reqCount=4;

        for(let n=0;arrTiles.length>0 && n<reqCount;n++)
        {
            const _tile = this.getNextTile(arrTiles);
            this.loadOneTile(_tile,arrTiles,currentFIx);
        }

    }

    this.writeTile=function (tile,arrTiles,currentFIx,data)
    {
        const path = __dirname + '/'+this.desc.files[currentFIx].prefix+'/'+tile.z+'/';
        if (!fs.existsSync(path))
            fs.mkdirSync(path,{ recursive: true });
        fs.writeFileSync(path+this.desc.files[currentFIx].prefix+tile.z+'_'+tile.y+'_'+tile.x+'.'+this.ext[currentFIx],data.read());
        this.loadNextTile(tile,arrTiles,currentFIx);

        // if (arrTiles.length===0)
        // {
        //     setTimeout(() =>
        //     {
        //         this.startLoadTz(tile.z+1,currentFIx);
        //     }, this.desc.files[currentFIx].nextScaleDelay);
        // }
        // else
        // {
        //     const _tile = this.getNextTile(arrTiles);
        //     setTimeout(()=>
        //     {
        //         this.loadOneTile(_tile,arrTiles,currentFIx);
        //     }, this.desc.files[currentFIx].nextTileDelay);
        // }
    }

    this.loadNextTile=function (tile,arrTiles,currentFIx)
    {
        if (arrTiles.length===0)
        {
            setTimeout(() =>
            {
                this.startLoadTz(tile.z+1,currentFIx);
            }, this.desc.files[currentFIx].nextScaleDelay);
        }
        else
        {
            const _tile = this.getNextTile(arrTiles);
            setTimeout(()=>
            {
                this.loadOneTile(_tile,arrTiles,currentFIx);
            }, this.desc.files[currentFIx].nextTileDelay);
        }
    }


    this.loadOneTile =  function (tile,arrTiles,currentFIx)
    {
        const _url=this.desc.files[currentFIx].fCreateUrl(tile);
        const url = new URL(_url);

        const isHttps = url.protocol.startsWith("https");
        const options =
        {
            // hostname: url.hostname,
            // port: (url.port==null || url.port==="")?(isHttps?443:80):parseInt(url.port),
            // path: url.pathname,
            method: 'GET',
            timeout: 6000,
            headers: desc.files[currentFIx].headers
        }

        const requester=isHttps?https:http;

        if (this.mode)
        {
            if (this.checkCount === undefined)
                    this.checkCount=0;
            this.totalReq++;
            setTimeout
            (
                ()=>
                {
                    let data = new Stream();
                    data.push(''+this.checkCount);
                    this.checkCount++;

                    this.endReq++;
                    if (this.mode===2)
                    {
                        let tix = Math.floor(Math.random() * 100);
                        if (tix>=65)
                            this.push2ErrMap(tile, "Test_Error",currentFIx);
                        this.loadNextTile(tile,arrTiles,currentFIx);
                    }
                    else
                        this.writeTile(tile,arrTiles,currentFIx,data);
                },testTimeOut
            )
        }
        else
            try
            {
                this.totalReq++;
                requester.get(url.href,options, (res) =>
                {

                    if (res.statusCode !== 200)
                    {
                        // console.error(`Did not get an OK from the server. Code: ${res.statusCode}`);
                        this.endReq++;
                        this.push2ErrMap(tile, res.statusCode,currentFIx);
                        res.resume();
                        // this.loadNextTile(tile,arrTiles,currentFIx);//TODO switch on after debugging
                        return;
                    }

                    let data = new Stream();
                    res.on('error',(err)=>
                        {
                            this.endReq++;
                            this.push2ErrMap(tile, err,currentFIx);
                            // this.loadNextTile(tile,arrTiles,currentFIx);//TODO switch on after debugging
                        }
                    )
                    res.on('data', (chunk) => {
                        data.push(chunk);
                    });

                    res.on('close', () =>
                        {
                            this.endReq++;
                            this.writeTile(tile,arrTiles,currentFIx,data)
                        }
                    );
                });
            }
            catch(ex)
            {
               //TODO Stop executing for the task request error.
                console.log(ex);
                this.endReq++;
                throw ex;
            }
    }
}

module.exports={
    sradiusa,
    sradiusb,
    fEncoding,
    defNextScaleDelay,
    defNextTileDelay,
    defPauseBeforeNextAttempt,
    dateString,
    saveDescriptor2File,
    TileLoader,
    lonLat2Tile3395,
    lonLat2Tile3857,
    createUrlSZYX,
    getBBoxByTile,
    createUrlBBox,
    simpleConverter
}

