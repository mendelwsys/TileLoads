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
    {
        container:"mbtiles",
        areaName:"Москва",
        date:"2023.05.4",
        //Произвольный полигон для тетстирования, где-то в Москве
        polygon:[[37.6280,55.7567],[37.6259,55.7502],[37.6459,55.7494],[37.6459,55.7494],[37.6441,55.7498]],
        files:
        {
                name: "Тест Москва",
                sysName: "moscow",
                source: "wmsTileService",
                prefix: "RASTER_msk_",
                url: "https://{s.}tile.openstreetmap.org/{z}/{x}/{y}.png",
                serversPrefix:['','a.','b.','c.'],
                nextScaleDelay:10,
                nextTileDelay:10,
                fCreateUrl:function(tile)
                {
                   let tix = Math.floor(Math.random() * this.serversPrefix.length);
                   let _url=this.url;
                    _url=_url.replaceAll('{s.}',this.serversPrefix[tix])
                    _url=_url.replaceAll("{z}",tile.z)
                    _url=_url.replaceAll("{y}",tile.y)
                    _url=_url.replaceAll("{x}",tile.x)
                    return _url;
                },
                fConverter:TileModule.lonLat2Tile3857,
                options:
                {
                        constructorOptions:
                        {
                                srs: "EPSG%3A4326",
                                format: "image/png",
                                transparent: true,
                                isTiff: false,
                                layers: "msk"
                        }
                }
        },
        zoom:[13,16],
    }
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
