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
const TileWriter = require('./mbtile');
const {TileLoader} = require("./tileLoader");

var tasks=
[
    // {
    //     container:"mbtiles",
    //     areaName:"Moscow",
    //     date:"2023.05.4",
    //     //Произвольный полигон для тетстирования, где-то в Москве
    //     polygon:[[37.3,55.3],[38,56]],
    //     files:[
    //         {
    //             name: "Тест Москва",
    //             sysName: "moscowOS",
    //             source: "wmsTileService",
    //             prefix: "RASTER_msk_",
    //             url: "https://{s.}tile.openstreetmap.org/{z}/{x}/{y}.png",
    //             headers:
    //                 {
    //                     'Accept':'image/png',
    //                     'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
    //                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
    //                 },
    //             serversPrefix:['','a.','b.','c.'],
    //             nextScaleDelay:100,
    //             nextTileDelay:10,
    //             fCreateUrl:TileModule.createUrlSZYX,
    //             fConverter:TileModule.lonLat2Tile3857,
    //             options:
    //                 {
    //                     constructorOptions:
    //                         {
    //                             srs: "EPSG%3A4326",
    //                             format: "image/png",
    //                             transparent: true,
    //                             isTiff: false,
    //                             layers: "msk"
    //                         }
    //                 },
    //             zoom:[6,8],
    //         }
    //         ,{
    //             name: "Тест РоссРеестр",
    //             sysName: "rosreestr",
    //             source: "wmsTileService",
    //             prefix: "RASTER_RosReestr_bg_",
    //             url: "https://pkk.rosreestr.ru/arcgis/rest/services/BaseMaps/BaseMap/MapServer/tile/{z}/{y}/{x}",
    //             headers:
    //                 {
    //                     'Accept':'image/jpeg',
    //                     'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
    //                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
    //                 },
    //             nextScaleDelay:600,
    //             nextTileDelay:500,
    //             fCreateUrl:TileModule.createUrlSZYX,
    //             fConverter:TileModule.lonLat2Tile3857,
    //             options:
    //                 {
    //                     constructorOptions:
    //                         {
    //                             srs: "EPSG%3A4326",
    //                             format: "image/jpeg",
    //                             transparent: true,
    //                             isTiff: false,
    //                             layers: "rosreestr"
    //                         }
    //                 },
    //             // reqCount:5,
    //             zoom:[9,12],
    //         }
    //         ],
    // }
    // ,
    // {
    //     container:"mbtiles",
    //     areaName:"KirLesBackGround",
    //     date:"2023.05.7",
    //     polygon:[[82,50],[103,71]],
    //     attemptCounter:10,
    //     files:[
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
    //             fCreateUrl:TileModule.createUrlSZYX,
    //             fConverter:TileModule.lonLat2Tile3857,
    //             options:
    //                 {
    //                     constructorOptions:
    //                         {
    //                             srs: "EPSG%3A4326",
    //                             format: "image/png",
    //                             transparent: true,
    //                             isTiff: false,
    //                             layers: "kirlesOS"
    //                         }
    //                 },
    //             zoom:[6,7],
    //         }],
    // }
    // ,
    // {
    //     container:"mbtiles",
    //     areaName:"RosReestrBackGround",
    //     date:"2023.05.7",
    //     polygon:[[82,50],[103,71]],
    //     files:[
    //         {
    //             name: "Тест РоссРеестр",
    //             sysName: "rosreestr",
    //             source: "wmsTileService",
    //             prefix: "RASTER_RosReestr_bg_",
    //             url: "https://pkk.rosreestr.ru/arcgis/rest/services/BaseMaps/BaseMap/MapServer/tile/{z}/{y}/{x}",
    //             headers:
    //                 {
    //                     'Accept':'image/jpeg',
    //                     'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
    //                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
    //                 },
    //             nextScaleDelay:1000,
    //             nextTileDelay:100,
    //             fCreateUrl:TileModule.createUrlSZYX,
    //             fConverter:TileModule.lonLat2Tile3857,
    //             options:
    //                 {
    //                     constructorOptions:
    //                         {
    //                             srs: "EPSG%3A4326",
    //                             format: "image/jpeg",
    //                             transparent: true,
    //                             isTiff: false,
    //                             layers: "rosreestr"
    //                         }
    //                 },
    //             zoom:[6,7],
    //         }],
    // },
    // {
    //     container:"mbtiles",
    //     areaName:"GoogleBackGround",
    //     date:"2023.05.7",
    //     polygon:[[82,50],[103,71]],
    //     files:[
    //         {
    //             name: "Тест Google",
    //             sysName: "Google",
    //             source: "wmsTileService",
    //             prefix: "RASTER_Google_",
    //             url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    //             headers:
    //                 {
    //                     'Accept':'image/jpeg,image/jpg',
    //                     'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
    //                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
    //                 },
    //             nextScaleDelay:1000,
    //             nextTileDelay:250,
    //             fCreateUrl:TileModule.createUrlSZYX,
    //             fConverter:TileModule.lonLat2Tile3857,
    //             options:
    //                 {
    //                     constructorOptions:
    //                         {
    //                             srs: "EPSG%3A4326",
    //                             format: "image/jpeg",
    //                             transparent: true,
    //                             isTiff: false,
    //                             layers: "Google"
    //                         }
    //                 },
    //             zoom:[6,7],
    //         }],
    // }
    // ,
    //
    // {
    //     container:"mbtiles",
    //     areaName:"ArcGISBackGround",
    //     date:"2023.05.7",
    //     //Произвольный полигон для тетстирования, КирЛес
    //     polygon:[[82,50],[103,71]],
    //     files:[
    //         {
    //             name: "Тест ArcGIS",
    //             sysName: "ArcGIS",
    //             source: "wmsTileService",
    //             prefix: "RASTER_ArcGIS_bg_",
    //             url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    //             headers:
    //                 {
    //                     'Accept':'image/jpeg',
    //                     'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
    //                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
    //                 },
    //             nextScaleDelay:1000,
    //             nextTileDelay:500,
    //             fCreateUrl:TileModule.createUrlSZYX,
    //             fConverter:TileModule.lonLat2Tile3857,
    //             options:
    //                 {
    //                     constructorOptions:
    //                         {
    //                             srs: "EPSG%3A4326",
    //                             format: "image/jpeg",
    //                             transparent: true,
    //                             isTiff: false,
    //                             layers: "ArcGIS"
    //                         }
    //                 },
    //             zoom:[6,7],
    //         }],
    // }
    // ,
    {
        container:"mbtiles",
        areaName:"KirLes",
        date:"2023.05.7",
        //Произвольный полигон для тетстирования кирлеса
        polygon:[[82,50],[103,71]],
        files:[
            {
                name: "Тест Кирлес",
                sysName: "KirLes",
                source: "wmsTileService",
                prefix: "RASTER_kirles_",
                url:"https://kyrles.akadem.ru/gisServer/geoserver/wms?LAYERS=citorus:ForMen&service=WMS&request=GetMap&layers=citorus%3AForMen&styles=&format=image%2Fpng&transparent=true&version=1.1.1&srs=EPSG%3A3857&test=0.18172415236394368&width=256&height=256&bbox={bbox}",
                headers: //Заголово для формирования запроса к серверу.
                {
                    "Referer":"https://kyrles.akadem.ru/lesfondgeo/",
                    "Connection": "keep-alive",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
                    // "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                    'Accept':'image/png',
                    // "Accept-Encoding": "gzip, deflate, br",
                    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,be;q=0.6,pl;q=0.5",
                },


                nextScaleDelay:1000,  //Пауза перед началом обработки следующего масштаба по умолчнию TileModule.defNextScaleDelay
                nextTileDelay:300, //Пауза перед запросом следующейго тайла по умолчанию TileModule.defNextTileDelay
                //  attemptCounter:10, //Кол-во попыток скачать ошибочные тайлы ( по умолчанию 1) пауза перд следующей попыткой TileModule.defPauseBeforeNextAttempt
                // reqCount:5, //Кол-во  одновременны запросов к серверу.
                fCreateUrl:TileModule.createUrlBBox, //Функция формирования урла запроса тайла у сервера
                fConverter:TileModule.lonLat2Tile3857, //Функция преобразования координат из долготы широты в тайл

                options:
                    {
                        constructorOptions:
                            {
                                srs: "EPSG%3A4326",
                                format: "image/png",
                                transparent: true,
                                isTiff: false,
                                layers: "Kirles"
                            }
                    },
                zoom:[6,7],
            }],
    }
]

tasks.forEach
(
    (desc)=>
    {
        desc.date=TileModule.dateString();

        for (let ix=0;ix<desc.files.length;ix++)
            TileModule.saveDescriptor2File(desc,ix);

        desc.tileLoader = new TileModule.TileLoader(desc); //Use Debug mode===2 for debugging error handler without requests to server


        const callBackAfterLoad=function (timeout)
        {
            let _errCount=0;
            let errMap=this.errMap;
            for (let jx=0;jx<desc.files.length;jx++)
            {
                this.saveErrMap2File(jx);
                _errCount+=errMap[jx].totErrs;
            }
            console.log("Errors count:"+ _errCount+" timeout: "+ ((timeout===undefined)?"none":timeout));

            if(desc.attemptCounter === undefined)
                desc.attemptCounter=1;

            if (_errCount>0)
            {
                if (desc.attemptCounter>0)
                {
                    desc.attemptCounter--;
                    setTimeout
                    (
                        ()=>
                        {
                            desc.tileLoader.resetLoader();
                            desc.tileLoader.startLoading(callBackAfterLoad,errMap)
                        },
                        TileModule.defPauseBeforeNextAttempt
                    )
                }
                else
                    console.log("Mbtile file for "+desc.areaName+" was not generated, download tiles error:"+_errCount);
            }
            else
                TileWriter.createMBTile(desc);
        }

        desc.tileLoader.startLoading
        (
            callBackAfterLoad
        );
    }
)

// build mbtiles without downloads
// tasks.forEach
// (
//     (desc)=>
//     {
//         TileWriter.createMBTile(desc);
//     }
// )
