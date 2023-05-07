/*
скрипт(
  container: mbtiles,
  areaName: "Богучанское",
  date: 2022.08.15,
  polygon: [[[97.409484,58.255182],[97.411533,58.255779],[97.412197,58.256154],[97.413462,58.255963],[97.41491,58.25603],[97.415228,58.255894],[97.414492,58.255398],[97.414492,58.255065],[97.414458,58.254562],[97.412926,58.254491],[97.41261,58.253307],[97.411346,58.253272],[97.409484,58.255182]],
  files: [
    {"name": "Ортофотоплан, Павловское уч.",
    "sysName": "ploshadkadlaminecologia2022062022",
    "source": "wmsTileService",
    "prefix": "RASTER_Orthophotoplan_",
    "url": "https://kyrles.akadem.ru:8443/geoserver/citorus/wms?LAYERS=citorus:2022062022ploshadkadlaminecologia",
    "options": {
        "constructorOptions": {
          "srs": "EPSG%3A4326",
          "format": "image/png",
          "transparent": true,
          "isTiff": false,
          "layers": "citorus:2022062022ploshadkadlaminecologia"
        }
      }),
    "zoom": [1,17]},
    {"name", "sysName", "source", "prefix", "url", "options", "zoom"}
])
 */


const TileModule = require('./tileLoader');

var tasks=
[
    // {
    //     container:"mbtiles",
    //     areaName:"Москва",
    //     date:"2023.05.4",
    //     //Произвольный полигон для тетстирования, где-то в Москве
    //     polygon:[[37.6280,55.7567],[37.6259,55.7502],[37.6459,55.7494],[37.6459,55.7494],[37.6441,55.7498]],
    //     files:
    //     {
    //             name: "Тест Москва",
    //             sysName: "moscow",
    //             source: "wmsTileService",
    //             prefix: "RASTER_msk_",
    //             url: "https://{s.}tile.openstreetmap.org/{z}/{x}/{y}.png",
    //             headers:
    //             {
    //                 'Accept':'image/png',
    //                 'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
    //                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
    //             },
    //             serversPrefix:['','a.','b.','c.'],
    //             nextScaleDelay:100,
    //             nextTileDelay:10,
    //             fCreateUrl:function(tile)
    //             {
    //                let tix = Math.floor(Math.random() * this.serversPrefix.length);
    //                let _url=this.url;
    //                 _url=_url.replaceAll('{s.}',this.serversPrefix[tix])
    //                 _url=_url.replaceAll("{z}",tile.z)
    //                 _url=_url.replaceAll("{y}",tile.y)
    //                 _url=_url.replaceAll("{x}",tile.x)
    //                 return _url;
    //             },
    //             fConverter:TileModule.lonLat2Tile3857,
    //             options:
    //             {
    //                     constructorOptions:
    //                     {
    //                             srs: "EPSG%3A4326",
    //                             format: "image/png",
    //                             transparent: true,
    //                             isTiff: false,
    //                             layers: "msk"
    //                     }
    //             },
    //             zoom:[13,16],
    //     },
    // },
    // {
    //     container:"mbtiles",
    //     areaName:"KirLesBackGround",
    //     date:"2023.05.7",
    //     //Произвольный полигон для тетстирования, где-то в Москве
    //     polygon:[[82,50],[103,71]],
    //     files:
    //         {
    //             name: "Тест КиреЛес",
    //             sysName: "kirles",
    //             source: "wmsTileService",
    //             prefix: "RASTER_kirles_bg_",
    //             url: "https://{s.}tile.openstreetmap.org/{z}/{x}/{y}.png",
    //             headers:
    //                 {
    //                     'Accept':'image/png',
    //                     'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
    //                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
    //                 },
    //             serversPrefix:['','a.','b.','c.'],
    //             nextScaleDelay:1000,
    //             nextTileDelay:100,
    //             fCreateUrl:function(tile)
    //             {
    //                 let tix = Math.floor(Math.random() * this.serversPrefix.length);
    //                 let _url=this.url;
    //                 _url=_url.replaceAll('{s.}',this.serversPrefix[tix])
    //                 _url=_url.replaceAll("{z}",tile.z)
    //                 _url=_url.replaceAll("{y}",tile.y)
    //                 _url=_url.replaceAll("{x}",tile.x)
    //                 return _url;
    //             },
    //             fConverter:TileModule.lonLat2Tile3857,
    //             options:
    //                 {
    //                     constructorOptions:
    //                         {
    //                             srs: "EPSG%3A4326",
    //                             format: "image/png",
    //                             transparent: true,
    //                             isTiff: false,
    //                             layers: "kirles"
    //                         }
    //                 },
    //             zoom:[6,7],
    //         },
    // }
    {
        container:"mbtiles",
        areaName:"RosReestrBackGround",
        date:"2023.05.7",
        //Произвольный полигон для тетстирования, где-то в Москве
        polygon:[[82,50],[103,71]],
        files:
            {
                name: "Тест РоссРеестр",
                sysName: "rosreestr",
                source: "wmsTileService",
                prefix: "RASTER_RosReestr_bg_",
                url: "https://pkk.rosreestr.ru/arcgis/rest/services/BaseMaps/BaseMap/MapServer/tile/",
                headers:
                    {
                        'Accept':'image/jpeg',
                        'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
                    },
                nextScaleDelay:1000,
                nextTileDelay:100,
                fCreateUrl:function(tile)
                {
                    // ResultURL:=GetURLBase+inttostr(GetZ-1)+'/'+inttostr(GetY)+'/'+inttostr(GetX);
                    let _url=this.url;
                    _url=_url+tile.z;
                    _url=_url+'/'+tile.y;
                    _url=_url+'/'+tile.x;
                    return _url;
                },
                fConverter:TileModule.lonLat2Tile3857,
                options:
                    {
                        constructorOptions:
                            {
                                srs: "EPSG%3A4326",
                                format: "image/jpeg",
                                transparent: true,
                                isTiff: false,
                                layers: "rosreestr"
                            }
                    },
                zoom:[6,7],
            },
    }
    // ,
    // {
    //     container:"mbtiles",
    //     areaName:"Кирлес",
    //     date:"2023.05.7",
    //     //Произвольный полигон для тетстирования кирлеса
    //     polygon:[[82,50],[103,71]],
    //     files:
    //         {
    //             name: "Тест Кирлес",
    //             sysName: "moscow",
    //             source: "wmsTileService",
    //             prefix: "RASTER_kirles_",
    //             url:"https://kyrles.akadem.ru/gisServer/geoserver/wms?LAYERS=citorus:ForMen&service=WMS&request=GetMap&layers=citorus%3AForMen&styles=&format=image%2Fpng&transparent=true&version=1.1.1&srs=EPSG%3A3857&test=0.18172415236394368&width=256&height=256&bbox={bbox}",
    //             headers:
    //             {
    //                 "Referer":"https://kyrles.akadem.ru/lesfondgeo/",
    //                 "Connection": "keep-alive",
    //                 "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
    //                 // "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    //                 'Accept':'image/png',
    //                 // "Accept-Encoding": "gzip, deflate, br",
    //                 "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,be;q=0.6,pl;q=0.5",
    //             },
    //
    //             nextScaleDelay:1000,
    //             nextTileDelay:100,
    //             fCreateUrl:function(tile)
    //             {
    //                 let _url=this.url;
    //
    //                 let totTile=1<<tile.z;
    //                 let bbox= [
    //                     [tile.x/totTile, tile.y/totTile],
    //                     [(tile.x+1)/totTile,
    //                         (tile.y+1)/totTile]]
    //
    //                 let wMul= 2*Math.PI * TileModule.sradiusa;
    //                 // let hmul= 2*Math.PI * TileModule.sradiusb;
    //                 for (let pt of bbox)
    //                 {
    //                     pt[0]=(pt[0] - 0.5) * wMul;
    //                     pt[1]= (0.5 - pt[1]) * wMul;
    //                 }
    //                 _url=_url.replaceAll(
    //                     "{bbox}",
    //                     ""+Math.min(bbox[0][0],bbox[1][0])+","+Math.min(bbox[0][1],bbox[1][1])+","+
    //                     Math.max(bbox[0][0],bbox[1][0])+","+Math.max(bbox[0][1],bbox[1][1])
    //                 )
    //                 return _url;
    //             },
    //             fConverter:TileModule.lonLat2Tile3857,
    //             options:
    //                 {
    //                     constructorOptions:
    //                         {
    //                             srs: "EPSG%3A4326",
    //                             format: "image/png",
    //                             transparent: true,
    //                             isTiff: false,
    //                             layers: "Kirles"
    //                         }
    //                 },
    //             zoom:[6,7],
    //         },
    // }
]

tasks.forEach
(
    (desc)=>
    {
        desc.date=TileModule.dateString();
        TileModule.saveDescriptor2File(desc);
        desc.tileLoader = new TileModule.TileLoader(desc);
        desc.tileLoader.startLoading(
            function ()
            {
                console.log("Errors count:"+ this.errMap.totErrs);
                this.saveErrMap2File();
            }
        );
    }
)
