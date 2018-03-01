var kartView;
var kart;
var diverseResultat;
var bakkeLag;
var hitResultat;
require([
  'esri/Map',
  'esri/views/MapView',
  'esri/Basemap',
  'esri/layers/TileLayer',
  'esri/layers/FeatureLayer',
  'esri/geometry/Extent',
  'esri/geometry/SpatialReference',
  'esri/widgets/LayerList',
  'esri/widgets/Locate',
  'esri/Graphic',
  'esri/layers/ElevationLayer',
  'esri/Ground',
  'dojo/domReady!',
], function (
  Map, MapView, Basemap, TileLayer,
  FeatureLayer, Extent, SpatialReference,
  LayerList, Locate, Graphic, ElevationLayer, Ground
) {
  /************************************************************
   * Creates a new WebMap instance. A WebMap must reference
   * a PortalItem ID that represents a WebMap saved to
   * arcgis.com or an on-premise portal.
   *
   * To load a WebMap from an on-premise portal, set the portal
   * url with esriConfig.portalUrl.
   ************************************************************/
  var nvdbBasemap = new TileLayer({
    url: 'https://nvdbcache.geodataonline.no/arcgis/rest/services/Trafikkportalen/GeocacheTrafikkJPG/MapServer',
    id: 'NVDB-trafikk',
  });
  var bilder = new TileLayer({
      url: 'https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_EUREF89/GeocacheBilder/MapServer',
      id: 'Bilder',
      visible: false,
    });
  var fl = new FeatureLayer({
      url: 'https://kart.tromso.kommune.no/arcgis/rest/services/Temadata/FlyplassTema/MapServer/5',
      id: 'testlag',
    });

  var bakke = ElevationLayer({
      url: 'https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_EUREF89/GeocacheTerreng/ImageServer',
    });
  bakkeLag = bakke;
  var nvdbBasemap = new Basemap({
    baseLayers: [nvdbBasemap],
    title: 'NVDB',
    id: 'nvdb',
  });

  // Create a Map instance
  var map = new Map({
    basemap: nvdbBasemap,
    ground: new Ground({
      layers: [bakke],
    }),
    layers: [bilder, fl],
  });

  kart = map;

  var extent = new Extent({
    xmin: 373601,
    ymin: 7507874,
    xmax: 721751,
    ymax: 7743925,
    spatialReference: new SpatialReference({ wkid: 25833, }),
  });

  /************************************************************
   * Set the WebMap instance to the map property in a MapView.
   ************************************************************/
  var view = new MapView({
    map: map,
    container: 'viewDiv',
  });

  var locateWidget = new Locate({
    view: view,   // Attaches the Locate button to the view
    graphic: new Graphic({
      symbol: { type: 'simple-marker' },  // overwrites the default symbol used for the
      // graphic placed at the location of the user when found
    }),
  });

  var layerList = new LayerList({
    view: view,
  });

  kartView = view;

  view.extent = extent;
  view.ui.add('info', 'bottom-left');
  view.ui.add('baseToggle', 'top-right');

  //view.ui.add(layerList, 'top-left');
  view.ui.add(locateWidget, 'bottom-right');

  view.then(function () {
    var baseToggle = document.querySelector('#baseToggle');
    var img = document.querySelectorAll('#baseToggle img');
    var lag = {};

    bilder.load().then(function () {
      map.allLayers.items.forEach(function (element) {
        lag[element.title] = element;
      });

      baseToggle.addEventListener('click', function () {
        img[0].classList.toggle('hide');
        img[1].classList.toggle('hide');
        lag.GeocacheBilder.visible = !lag.GeocacheBilder.visible;
        lag.GeocacheTrafikkJPG.visible = !lag.GeocacheTrafikkJPG.visible;
      });
    });
  });

  view.on('click', function (event) {
        view.hitTest(event).then(function (response) {
          hitResultat = response;
          bakke.queryElevation(hitResultat.screenPoint.mapPoint).then(function (results) {
            diverseResultat = results;
            console.log(results);
          });
        });

        // you must overwrite default click-for-popup
        // behavior to display your own popup
        event.stopPropagation();

        var screenPoint = {
          x: event.x,
          y: event.y,
        };

        view.popup.open({
          // Set the popup's title to the coordinates of the location
          title: 'Geokoding',
          location: event.mapPoint, // Set the location of the popup to the clicked location,
          content: '<a href="https://www.vegvesen.no/vegkart/vegkart/#kartlag:geodata/@' + view.toMap(screenPoint).x.toString().split('.')[0] + ',' + view.toMap(screenPoint).y.toString().split('.')[0] + ',' + view.zoom + ' target="#">Link til vegkart</a>',  // content displayed in the popup
        });
      });

    view.on("pointer-move", function(event){
    var info = document.querySelector("#info");
    var screenPoint = {
      x:event.x,
      y:event.y
    }
    var mapPoint = view.toMap(screenPoint)
    info.innerHTML = mapPoint.x.toString().split(".")[0] + "<br\>" + mapPoint.y.toString().split(".")[0];
    })

});
