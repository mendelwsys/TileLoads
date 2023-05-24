# TileLoader

﻿Загрузчик тайлов.
Загружает тайлы и делает из них файл c расширением *.mbtiles
Примеры запуска и описание параметров в startLoader.js
Производится фильтрация тайлов по полигону, для текущей версии фильтрация
работает до 110 000 000  тайлов, ( надо установить --max-old-space-size=8192 при запуске)
Предел тайлов превышается для примера в startLoader при 21-м масштабе.

Для приведенного примера кол-во отфильтрованных тайлов:

15 : Tile has been filtered :29058 of: 51865 sec:0
16 : Tile has been filtered :114972 of: 206545 sec:0
17 : Tile has been filtered :457234 of: 823536 sec:1
18 : Tile has been filtered :1823422 of: 3286848 sec:3
----------------------------------------------------------
19 : Tile has been filtered :7282737 of: 13136838 sec:7
20 : Tile has been filtered :29108927 of: 52540826 sec:13
21 : Tile has been filtered :116391689 of: 210147202 sec:27
20 : Tile has been filtered :29108927 of: 52540826 sec:13
