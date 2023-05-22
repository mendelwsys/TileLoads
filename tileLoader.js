const https = require('https');
const http = require('http');
const fs = require('fs');
const Stream = require('stream').Transform;

const sradiusa=6378137 ;//Радиус земли по экв.
const sradiusb=6356752 ;//Радиус земли по мерид.
let fEncoding = 'utf-8';

const defNextScaleDelay=100; //Пауза перед следующим запросом масштаба по умолчанию
const defNextTileDelay=10; //Пауза перед следующим запросо тайла по умолчанию
const testTimeOut = 100; //Применяется для тестирования.
const findFormat=/image\/(\w+)/;
let waitDownLoadTimeOut = 10000; //Ожидание того, что все сделанные на сервер запросы будут завершены
let checkTimeout=500; //пауза перед проверкой, того что все сделанные запросы завершены
let defPauseBeforeNextAttempt=1000; //Пауза перед пследующей попыткой получения ошибочных тайлов
let defLogCounter = 1000;//Выводить в лог состояние скачивания после каждого defLogCounter запроса.
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
// // current hours
//     let hours = date_ob.getHours();
// // current minutes
//     let minutes = date_ob.getMinutes();
// // current seconds
//     let seconds = date_ob.getSeconds();
    return year + "." + month + "." + date;
}

const direction=function (a, b, c)
{
    let val = (b.y - a.y) * (c.x - b.x)
        - (b.x - a.x) * (c.y - b.y);

    if (val === 0)
        // Collinear
        return 0;

    else if (val < 0)
        // Anti-clockwise direction
        return 2;

    // Clockwise direction
    return 1;
}

const onLine=function(l1, p)
{
    // Check whether p is on the line or not
    return (Math.min(l1.p1.x, l1.p2.x) <= p.x && p.x <= Math.max(l1.p1.x, l1.p2.x))
        && (Math.min(l1.p1.y, l1.p2.y) <= p.y && p.y <= Math.max(l1.p1.y, l1.p2.y));

}

// const isInBBox=function (bbox,pt)
// {
//     return (
//             (bbox.p1.x<=pt.x && pt.x<=bbox.p4.x)
//              && (bbox.p1.y<=pt.y && pt.y<=bbox.p4.y)
//            )
// }

const isIntersectA=function (l1, pt)
{
    let Y1=l1.p1.y;
    let Y2=l1.p2.y;
    if (l1.p1.y>l1.p2.y)
    {
        Y1=l1.p2.y;
        Y2=l1.p1.y;
    }

    return Y1 <= pt.y
        &&
        pt.y <= Y2
        &&
        pt.x >= Math.min(l1.p1.x, l1.p2.x);
}

const isIntersect=function (l1, l2)
{

    //Проверка ограничивающими прямоугольниками
    // {
    //     //первый прямоугольник
    //     const X1 = Math.min(l1.p1.x, l1.p2.x);
    //     const X2 = Math.max(l1.p1.x, l1.p2.x);
    //     const Y1 = Math.min(l1.p1.y, l1.p2.y);
    //     const Y2 = Math.max(l1.p1.y, l1.p2.y);
    //     //второй прямоугольник
    //     const X3 = Math.min(l2.p1.x, l2.p2.x);
    //     const X4 = Math.max(l2.p1.x, l2.p2.x);
    //     const Y3 = Math.min(l2.p1.y, l2.p2.y);
    //     const Y4 = Math.max(l2.p1.y, l2.p2.y);
    //
    //     //проверка пересечения
    //     if (X2 < X3 || X4 < X1 || Y2 < Y3 || Y4 < Y1)
    //         return false;
    // }


    let dir1 = direction(l1.p1, l1.p2, l2.p1);
    let dir2 = direction(l1.p1, l1.p2, l2.p2);
    let dir3 = direction(l2.p1, l2.p2, l1.p1);
    let dir4 = direction(l2.p1, l2.p2, l1.p2);

    // When intersecting
    if (dir1 !== dir2 && dir3 !== dir4)
        return 1;

    // When p2 of line2 are on the line1
    if (dir1 === 0 && onLine(l1, l2.p1))
        return 2;

    // When p1 of line2 are on the line1
    if (dir2 === 0 && onLine(l1, l2.p2))
        return 2;

    // When p2 of line1 are on the line2
    if (dir3 === 0 && onLine(l2, l1.p1))
        return 2;

    // When p1 of line1 are on the line2
    if (dir4 === 0 && onLine(l2, l1.p2))
        return 2;

    return 0;
}

const checkInside=function(poly, p)
{
        const n=poly.length;

        // When polygon has less than 3 edge, it is not polygon
        if (n < 3)
            return false;

        // Create a point at infinity, y is same as point p
        // let tmp=new Point(9999, p.y);
        let exLine = {p1:p, p2:{x:0,y:p.y}};
        let count = 0;
        let i = 0;
        let side={p1:{},p2:{}};
        do
        {
            // Forming a line from two consecutive points of
            // poly
            side.p1=poly[i];
            side.p2=poly[(i + 1) % n];

            let rv=0;
            if (isIntersectA(side,p) && (rv=isIntersect(side, exLine))!==0)
            {
                // If side is intersects exline
                if (rv===2 && direction(side.p1, p, side.p2) === 0)
                    return onLine(side, p);
                count++;
            }
            i = (i + 1) % n;
        } while (i !== 0);

        // When count is odd
        return count & 1;
}
// const checkIntersect=function(poly, l1)
// {
//     const p1 = l1.p1;
//     const p2 =  l1.p2;
//     const n=poly.length;
//     if (
//         checkInside(poly,p1) ||
//         checkInside(poly,p2))
//         return true;
//
//     let i = 0;
//     do
//     {
//         // Forming a line from two consecutive points of
//         // poly
//         let side = {p1:poly[i], p2:poly[(i + 1) % n]};
//         if (isIntersect(side, l1)!==0)
//             return true;
//         i = (i + 1) % n;
//     } while (i !== 0);
//     return false;
// }


const checkIntersect2=function(poly, l1)
{
    const n=poly.length;
    let i = 0;
    let side = {p1: {}, p2: {}};
    do
    {
        // Forming a line from two consecutive points of
        // poly
        side.p1=poly[i];
        side.p2=poly[(i + 1) % n];
        if (isIntersect(side, l1)!==0)
            return true;
        i = (i + 1) % n;
    } while (i !== 0);
    return false;
}

const checkInRect=function(poly, rect)
{
    for (let i=0;i<poly.length;i++)
    {
        if
        (
              (rect.p1.x<=poly[i].x && poly[i].x<=rect.p4.x)
              && (rect.p1.y<=poly[i].y && poly[i].y<=rect.p4.y)
        )
            return  true;

    }

    return false;
}


/**
 *
 * @param poly - poly for analize
 * @param rect - rect for analyze
 * @returns {number} rect 0- outBoard 1-onBoard,2-inBoard
 */
const checkPolyIntersect2= function (poly,rect)
{
    const p1 = rect.p1;
    const p4 = rect.p4;
    const pLD={x:p1.x,y:p4.y};
    const pRU={x:p4.x,y:p1.y};

    if(   checkIntersect2(poly, {p1: p1, p2: pRU})
        || checkIntersect2(poly, {p1: p1, p2: pLD})
        || checkIntersect2(poly, {p1: p4, p2: pRU})
        || checkIntersect2(poly, {p1: p4, p2: pLD}))
        return 1;

    if (checkInside(poly, p1))
        return 2;

    if (checkInRect(poly,rect))
        return 1;

    return 0;
}


const checkPolyIntersect= function (poly,rect)
{
    const p1 = rect.p1;
    const p4 = rect.p4;
    const pLD={x:p1.x,y:p4.y};
    const pRU={x:p4.x,y:p1.y};

    if( checkInside(poly, p1)
        || checkIntersect2(poly, {p1: p1, p2: pRU})
        || checkIntersect2(poly, {p1: p1, p2: pLD})
        || checkIntersect2(poly, {p1: p4, p2: pRU})
        || checkIntersect2(poly, {p1: p4, p2: pLD}))
    return true;

    return checkInRect(poly,rect);
}

const tile2Rec=function(tile,dxdy,k)
{
    if (k===undefined)
         k=1;
    // const  totTile=1;
    // return {
    //     p1: {x: k*(tile.x / totTile), y: k*(tile.y / totTile)},
    //     p4: {x: k*((tile.x + 1) / totTile), y: k*((tile.y + 1) / totTile)}
    // };
    return {
        p1: {x: k*(tile.x), y: k*(tile.y)},
        p4: {x: k*((tile.x + dxdy[0])), y: k*(tile.y + dxdy[1])}
    };

}

const lonLatPoly2TilePoly=function(polyArr,fConverter,totTile,k)
{

    if (k===undefined)
        k=1;
    k*=totTile;

    let rv=[];
    polyArr.forEach(
        (pta)=>{
            let pt=fConverter({x:pta[0],y:pta[1]})
            pt.x*=k;
            pt.y*=k;
            rv[rv.length]=pt;
        }
    )
    return rv;
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
/**
 *
 * @param desc - Loader descriptor ( see in startLoader.js example )
 * @param mode - mode ( mode===undefined or 0 = work by descriptor
 *                      mode=== 1 debug don't request to server write down order number in tile files
 *                      mode===2 debug don't request to server error loading emulation do not write tile files)
 * @constructor
 */
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

    this.totTileLoader=0;

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

    this.resetLoader=function ()
    {
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

    function getTilesCount(arrBlocksIn, arrBlocksBrd, tz) {
        let tileCounter = 0;
        for (let scale in arrBlocksIn)
        {
            let splitCount = 1 << (tz - scale);
            tileCounter += (arrBlocksIn[scale].length / 2) * splitCount * splitCount;
        }
        tileCounter += arrBlocksBrd.length / 2;
        return tileCounter;
    }
    function blocks2TilesArray(arrBlocksIn, arrBlocksBrd, tz)
    {
        let tileCounter=0;
        let arrTiles=[];
        let startMSec=Date.now();
        for (let scale in arrBlocksIn)
        {
            let splitCount = 1 << (tz - scale);
            let tilesInBlocks = arrBlocksIn[scale];
            for (let ixb=0;ixb<tilesInBlocks.length;ixb+=2)
            {
                    let txStart=tilesInBlocks[ixb];
                    let tyStart=tilesInBlocks[ixb+1];
                    for (let tx=txStart;tx<txStart+splitCount;tx++)
                        for (let ty=tyStart;ty<tyStart+splitCount;ty++)
                        {
                            arrTiles[arrTiles.length]= {z:tz,x:tx,y:ty};
                            tileCounter++;
                            if (tileCounter%10000000===0)
                                console.log(""+tz+" : Tiles has been copied:"+tileCounter+" sec:"+Math.floor((Date.now()-startMSec)/1000));
                        }
            }
        }

        for (let ixb=0;ixb<arrBlocksBrd.length;ixb+=2)
        {
            let tx=arrBlocksBrd[ixb];
            let ty=arrBlocksBrd[ixb+1];
            arrTiles[arrTiles.length]= {z:tz,x:tx,y:ty};
        }

        return arrTiles;
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
        let filterPoly=lonLatPoly2TilePoly(this.desc.polygon,this.desc.files[currentFIx].fConverter,totTiles);

        if (this.pErrMap===undefined || this.pErrMap[currentFIx]===undefined)
        {
            let startMSec=Date.now()
            let tileCounter=0;

            { //fastest filter, but array copying is very resource intensive starting for scale 21 has memory allocate problems
                console.log("Start filter for Scale: "+tz+" ...")
                let mult=1;
                const one2oneZ=10;
                const k=1;

                if (tz>one2oneZ)
                    mult<<=(tz-one2oneZ)

                let dxBlock=k*mult;
                let dyBlock=k*mult;

                let currScale=Math.min(tz,one2oneZ);
                let arrBlocksIn=[];
                arrBlocksIn[currScale]=[];
                let arrBlocksBrd=[];

                let rect =
                    {
                        p1: {x:  0, y: 9},
                        p4: {x: 0, y: 0}
                    };

                for (let tx=xStart;tx<=xStop;tx+=dxBlock)
                    for (let ty=yStart;ty<=yStop;ty+=dyBlock)
                    {
                        let rv=0;
                        rect.p1.x=tx;
                        rect.p1.y=ty;
                        rect.p4.x=tx+dxBlock;
                        rect.p4.y=ty+dyBlock;

                        if ((rv=checkPolyIntersect2(filterPoly,rect))!==0)
                        {
                            if (rv===2)
                            {
                                arrBlocksIn[currScale][arrBlocksIn[currScale].length]=tx;
                                arrBlocksIn[currScale][arrBlocksIn[currScale].length]=ty;
                            }
                            else
                            {
                                arrBlocksBrd[arrBlocksBrd.length]=tx;
                                arrBlocksBrd[arrBlocksBrd.length]=ty;
                            }
                        }
                    }

                while(dxBlock>1)
                {
                    currScale++;
                    arrBlocksIn[currScale]=[];

                    let _arrBlocksBrd=[]

                    const _dxBlock=dxBlock;
                    const _dyBlock=dyBlock;
                    dxBlock>>=1;
                    dyBlock>>=1;

                    for (let ix=0;ix<arrBlocksBrd.length;ix+=2)
                    {

                        const block_tx=arrBlocksBrd[ix];
                        const block_ty=arrBlocksBrd[ix+1];

                        for (let tx=block_tx;tx<block_tx+_dxBlock;tx+=dxBlock)
                            for (let ty=block_ty;ty<block_ty+_dyBlock;ty+=dyBlock)
                            {

                                rect.p1.x=tx;
                                rect.p1.y=ty;
                                rect.p4.x=tx+dxBlock;
                                rect.p4.y=ty+dyBlock;

                                let rv=0;
                                if ((rv=checkPolyIntersect2(filterPoly,rect))!==0)
                                {
                                    if (rv===2)
                                    {
                                        arrBlocksIn[currScale][arrBlocksIn[currScale].length]=tx;
                                        arrBlocksIn[currScale][arrBlocksIn[currScale].length]=ty;
                                    }
                                    else
                                    {
                                        _arrBlocksBrd[_arrBlocksBrd.length]= tx;
                                        _arrBlocksBrd[_arrBlocksBrd.length]= ty;
                                    }
                                }
                            }
                    }
                    arrBlocksBrd=_arrBlocksBrd;
                    if (dxBlock>1)
                    {
                        tileCounter = getTilesCount(arrBlocksIn, arrBlocksBrd, currScale);
                        console.log(""+currScale+" TotalCounter:"+tileCounter+" : BlocksOnBoard:"+(arrBlocksBrd.length/2)+" sec:"+Math.floor((Date.now()-startMSec)/1000));
                    }
                }

                console.assert(tz===currScale);
                tileCounter = getTilesCount(arrBlocksIn, arrBlocksBrd, tz);
                console.log(""+tz+" : Tile has been filtered :"+tileCounter+" of: "+(yStop-yStart+1)*(xStop-xStart+1)+" sec:"+Math.floor((Date.now()-startMSec)/1000))
                console.log("Copy to tiles array...")
                arrTiles=blocks2TilesArray(arrBlocksIn, arrBlocksBrd, tz);
                console.assert(arrTiles.length===tileCounter);
                console.log("Tiles have been copied sec:"+Math.floor((Date.now()-startMSec)/1000))
            }
            // { // A little faster, but not exactly
            //     let mult=1;
            //     const one2oneZ=15;
            //     const k=1;
            //
            //     if (tz>one2oneZ)
            //         mult<<=(tz-one2oneZ)
            //
            //     let dxBlock=k*mult;
            //     let dyBlock=k*mult;
            //
            //     let checkTile = {z:tz,x:0,y:0};
            //     for (let tx=xStart;tx<=xStop;tx+=dxBlock)
            //         for (let ty=yStart;ty<=yStop;ty+=dyBlock)
            //         {
            //             checkTile.x=tx;
            //             checkTile.y=ty;
            //             if (checkPolyIntersect(filterPoly,tile2Rec(checkTile,[dxBlock,dyBlock])))
            //             {
            //                 for (let tx1=tx;tx1<tx+dxBlock;tx1++)
            //                     for (let ty1=ty;ty1<ty+dyBlock;ty1++)
            //                     {
            //                         arrTiles[arrTiles.length]= {z:tz,x:tx1,y:ty1};
            //                         if (tileCounter%5000000===0)
            //                             console.log(" "+tz+" : Tile Filtered:"+tileCounter+" of: "+(yStop-yStart+1)*(xStop-xStart+1)+" sec:"+Math.floor((Date.now()-startMSec)/1000));
            //                         tileCounter++;
            //                     }
            //             }
            //         }
            // }

            // { //It's very slow filter
            //     let checkTile = {z:tz,x:0,y:0};
            //     for (let tx=xStart;tx<=xStop;tx++)
            //         for (let ty=yStart;ty<=yStop;ty++)
            //         {
            //             checkTile.x=tx;
            //             checkTile.y=ty;
            //             if (checkPolyIntersect2(filterPoly,tile2Rec(checkTile,[1,1])))
            //             {
            //                 arrTiles[arrTiles.length]= {z:tz,x:tx,y:ty};
            //                 if (tileCounter%50000===0)
            //                     console.log(" "+tz+" : Tile Filtered:"+tileCounter+" of: "+(yStop-yStart+1)*(xStop-xStart+1)+" sec:"+Math.floor((Date.now()-startMSec)/1000));
            //                 tileCounter++;
            //             }
            //         }
            //     console.log(""+tz+" : Tile has been filtered :"+tileCounter+" of: "+(yStop-yStart+1)*(xStop-xStart+1)+" sec:"+Math.floor((Date.now()-startMSec)/1000))
            // }

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

        // if (arrTiles.length===0) //
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

    this.loadNextTile=function (tile,arrTiles,currentFIx,delay)
    {

        if (arrTiles.length===0)
        {
            if (delay ===undefined)
                delay= this.desc.files[currentFIx].nextScaleDelay;

            setTimeout(() =>
            {
                this.startLoadTz(tile.z+1,currentFIx);
            }, delay);
        }
        else
        {
            if (delay ===undefined)
                delay= this.desc.files[currentFIx].nextTileDelay;

            const _tile = this.getNextTile(arrTiles);
            setTimeout(()=>
            {
                this.loadOneTile(_tile,arrTiles,currentFIx);
            }, delay);
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
        if (this.totTileLoader%defLogCounter===0)
        {
            console.log("Scale:"+tile.z+" Remains:"+arrTiles.length+" Index in files array:"+currentFIx);
            console.log("Errors:"+(this.errMap[currentFIx].totErrs)+" Requests:"+(this.totalReq)+" Complete:"+(this.endReq));
            console.log("=")
        }

        this.totTileLoader++;
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
                        if (tix>=65) //Error modeling 35% - error probability
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
                    const pathTiles = __dirname + '/'+this.desc.files[currentFIx].prefix+'/'+tile.z+'/';
                    const fullTileFile=pathTiles+this.desc.files[currentFIx].prefix+tile.z+'_'+tile.y+'_'+tile.x+'.'+this.ext[currentFIx];
                    if (fs.existsSync(fullTileFile))
                    {
                        this.loadNextTile(tile,arrTiles,currentFIx,0);
                    }
                    else
                    {
                        this.totalReq++;
                        let out=requester.get(url.href,options, (res) =>
                        {

                            if (res.statusCode !== 200)
                            {
                                // console.error(`Did not get an OK from the server. Code: ${res.statusCode}`);
                                res.resume();
                                this.endReq++;
                                this.push2ErrMap(tile, res.statusCode,currentFIx);
                                this.loadNextTile(tile,arrTiles,currentFIx);
                                return;
                            }

                            let data = new Stream();
                            res.on('error',(err)=>
                                {
                                    this.endReq++;
                                    this.push2ErrMap(tile, err,currentFIx);
                                    this.loadNextTile(tile,arrTiles,currentFIx);
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

                        out.on('error',(err)=>
                        {
                            this.endReq++;
                            this.push2ErrMap(tile, err,currentFIx);
                            this.loadNextTile(tile,arrTiles,currentFIx);
                        })
                    }
            }
            catch(ex)
            {
               //TODO Stop executing for the task request error.
                console.log(ex);
                this.endReq++;
                throw ex;
            }
    }

    this.resetLoader();
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

