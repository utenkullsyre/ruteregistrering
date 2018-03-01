require([
  "esri/Map",
  "esri/layers/TileLayer",
  "esri/layers/MapImageLayer",
  "esri/Basemap",
  "esri/layers/ElevationLayer",
  "esri/views/SceneView",
  "esri/widgets/Locate",
  "esri/Graphic",
  "esri/Viewpoint",
  "esri/geometry/Point",
  "esri/widgets/DirectLineMeasurement3D",
  "esri/widgets/Legend",
  "esri/request",
  "esri/geometry/Circle",
  "esri/layers/GraphicsLayer",
  "esri/symbols/PictureMarkerSymbol",
  'dojo/on',
  "esri/config",
  "dojo/domReady!"

], function(
  Map, TileLayer, MapImageLayer, Basemap, ElevationLayer, SceneView,
  Locate, Graphic, Viewpoint, Point, DirectLineMeasurement3D, Legend, esriRequest, Circle,GraphicsLayer,PictureMarkerSymbol,on, esriConfig
) {

  // Create elevation layers
  var bakke = new ElevationLayer({
    url: "https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_EUREF89/GeocacheTerreng/ImageServer"
  });

  var bilder = new TileLayer({
      url: "https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_EUREF89/GeocacheBilder/MapServer",
      id: "Bilder",
      visible: true
    });

  var bratthet = new MapImageLayer({
    url: "https://wms3.nve.no/map/rest/services/Bratthet/MapServer",
    sublayers: [
        {
          id: 0,
          visible: true,
          opacity: .5,
          legendEnabled: true,
        }
      ]
    });

  var skredHendelser = new MapImageLayer({
    url: "https://wms3.nve.no/map/rest/services/SkredHendelser/MapServer",
    sublayers: [
        {
          id: 1,
          visible: false,
          legendEnabled: true,
        }
      ]
    });

  console.log('Lag', bratthet, skredHendelser)



   var bilder = new Basemap({
     baseLayers: [bilder],
     title: "Bilder",
     id: "bilder"
   });

  // Create Map and View
  var map = new Map({
    basemap: bilder,
    ground: {
      layers: [bakke]
    }
  });

  var view = new SceneView({
    container: "viewDiv",
    map: map,
    camera: {
      // initial view:
      heading: 332.8,
      tilt: 30,
      position: {
        x: 564096,
        y: 7628465,
        z: 5000,
        spatialReference: {
          wkid: 25833
        }
      }
    }
  });

  // Create a symbol for rendering the graphic
  var fillSymbol = {
    type: "simple-fill", // autocasts as new SimpleFillSymbol()
    color: [0, 0, 0, 0],
    outline: { // autocasts as new SimpleLineSymbol()
      color: [241, 33, 0],
      width: 2
    }
  }

  var markerSymbol = {
    type: "point-3d",  // autocasts as new PointSymbol3D()
    symbolLayers: [{
      type: "icon",  // autocasts as new IconSymbol3DLayer()
      size: 12,  // points
      resource: { primitive: "square" },
      material: { color: [165, 201, 213,0.5] },
      outline: {
        color: "blue",
        size: "1px"
      }
    }]
  };

  var grafikkLag = new GraphicsLayer({
    elevationInfo: "on-the-ground",
    visible: true,
    title: 'Skredhendelser'
  })

  view.map.addMany([bratthet, skredHendelser, grafikkLag])
  console.log("Lag",view)

  var locateWidget = new Locate({
    view: view,   // Attaches the Locate button to the view
    graphic: new Graphic({
      symbol: { type: "simple-marker" }  // overwrites the default symbol used for the
      // graphic placed at the location of the user when found
    })
  });
  // var measureWidget = new DirectLineMeasurement3D({
  //   view: view
  // });

var viewElement

  view.when(function () {
    viewElement = document.querySelector('#viewDiv')
    console.log("View",view);

    var viewpoint = new Viewpoint({
      targetGeometry: new Point({
        x: 644831,
        y: 7734548
      }),
      scale: 2000,
      heading: 20,
      tilt: 10
    })

    var legend = new Legend({
      view: view
    })
    view.toolactive = false

    // Add widget to the bottom right corner of the view
    view.ui.add(legend, "top-right");


    view.goTo(viewpoint);

    view.ui.add(locateWidget, "bottom-right")
    view.ui.add("queryRes", "bottom-left")
    view.ui.add('hitTest', 'bottom-left')
    // view.ui.add(measureWidget, "top-right");
    // view.on("click",function(){
    //   console.log(view)
    // });
    // var test = view.activeTool
    // console.log(test)
    // var handle = test.watch("directDistance", function(nyVerdi,gmlVerdi,property,objekt){
    //   if(objekt.verticalDistance){console.log(objekt.horizontalDistance, objekt.verticalDistance)}
    //   console.log(objekt)
    // });

    // view.on("pointer-move",function(evt){
    //   var hoydeDiv = document.querySelector("#hoydeinfo");
    //   hoydeDiv.style.left = evt.x + 10+"px";
    //   hoydeDiv.style.top = evt.y + 10 +"px";
    //
    //   var pos = view.toMap({
    //     x:evt.x,
    //     y:evt.y
    //   });
    //   var hoyde = bakke.queryElevation(pos);
    //   hoyde.then(function(res){
    //     hoydeDiv.innerHTML = res.geometry.z.toFixed(0) + " moh";
    //   })
    // })

    function queryExtent(pos,d) {
      var extent =  {}
      extent.xmin = pos.x - d
      extent.xmax = pos.x + d
      extent.ymin = pos.y - d
      extent.ymax  = pos.y + d
      return extent
    }


    function copyToClipboard(text) {
      window.prompt("x,y,z koordinat\nSRID: 25833\n\nKopier tekst: Ctrl+C, Enter", text);
    }

    // function queryOptions(){
    //   var options = {
    //     query: {
    //       where: 'skredtype in (130,131,132,133,134,135,136,137,138,139)',
    //       geometry:'{xmin: ' + view.extent.xmin + ', ymin: ' + view.extent.ymin + ', xmax: ' + view.extent.xmax + ', ymax: ' + view.extent.ymax + '}',
    //       geometryType: 'esriGeometryEnvelope',
    //       inSR:28533,
    //       spatialRel: 'esriSpatialRelIntersects',
    //       outFields: 'skredType, skredNavn, stedsnavn, skredTidspunkt, noySkredTidspunkt, persBerort, annetSkadet, redningsaksjon, vaerObservasjon, totAntPersOmkommet, ansvarligInstitusjon, beskrivelse, objektType, registrertDato, utlosningArsak, dokumentasjon',
    //       // outFields: '*',
    //       returnGeometry:true,
    //       returnTrueCurves:false,
    //       outSR:25833,
    //       returnIdsOnly:false,
    //       returnCountOnly:false,
    //       returnZ:false,
    //       returnM:false,
    //       returnDistinctValues:false,
    //       returnExtentsOnly:false,
    //       f: 'geojson',
    //     },
    //     responseType: 'json'
    //   };
    // return options
    // }

    function queryOptions(){
      var options = {
        query: {
          where: 'skredtype in (130,131,132,133,134,135,136,137,138,139)',
          geometry:'{xmin: ' + view.extent.xmin + ', ymin: ' + view.extent.ymin + ', xmax: ' + view.extent.xmax + ', ymax: ' + view.extent.ymax + '}',
          geometryType: 'esriGeometryEnvelope',
          inSR:28533,
          spatialRel: 'esriSpatialRelIntersects',
          // outFields: 'skredType, skredNavn, stedsnavn,vaerObservasjonbeskrivelse, objektType, utlosningArsak, dokumentasjon',
          outFields: '*',
          returnGeometry:true,
          returnTrueCurves:false,
          outSR:25833,
          returnIdsOnly:false,
          returnCountOnly:false,
          returnZ:false,
          returnM:false,
          returnDistinctValues:false,
          returnExtentsOnly:false,
          f: 'geojson',
        },
        responseType: 'json'
      };
    return options
    }

    function addResponseData(item){
            var grafikk = new Graphic({
              geometry: new Point({
                  x: item.geometry.coordinates["0"],
                  y: item.geometry.coordinates["1"],
                  spatialReference: {
                    wkid: 25833
                  }
                }),
              symbol: markerSymbol,
              attributes: item.properties
            })
            grafikkLag.graphics.add(grafikk)
    }

    function fjernMeny(){
      meny.classList.add('gjemt')
      setTimeout(function(){
        meny.classList.add('skjult')
      }, 300)
    }

    var test = document.querySelector('#queryRes')
    var testResponse = document.querySelector('#hitTest')

    on(testResponse, 'click', function (evt) {
      var lyrView = view.allLayerViews.items[4]
      var handler1 = on(view, 'click', function (evt) {
        view.hitTest(evt)
        .then(function (response) {
          // if (response.result[0]) {
          //   var graphic = response.results[0].graphic
          //   view.whenLayerView(graphic.layer).then(function (lyrView) {
          //     lyrView.highlight(graphic)
          //   })
          //
          // }
          console.log(response)
        })
      })
    })

    on(test, "click", function () {
      fjernMeny()
      view.toolactive = true
      viewElement.style.cursor = 'crosshair'
      var initCamera = view.camera
      var heading = view.camera.heading;
      var heading = view.camera.tilt;
      view.goTo({
        heading:0,
        tilt: 35,
        scale: view.scale * 3.4
      })
      view.map.zoom = 4
      var tull = on.once(view, "click", function(evt) {
        var pos1 = view.toMap({
          x: evt.x,
          y: evt.y
        })
        var pos2
        view.graphics.removeAll();
        // on.once(view, "key-down", function(evt){
        //   if(test){
        //     view.graphics.removeAll()
        //   };
        // })
        var test = on(view, "pointer-move", function(evt){
          view.graphics.removeAll()
          grafikkLag.graphics.removeAll()
          pos2 = view.toMap({
            x: evt.x,
            y: evt.y
          })
          var polygon = new Graphic({
            geometry: {
              type: "polygon",
              rings: [
                [pos1.x, pos1.y],
                [pos1.x, pos2.y],
                [pos2.x, pos2.y],
                [pos2.x, pos1.y],
                [pos1.x, pos1.y]
              ],
              spatialReference: {
                wkid: 25833
              }
            },
            symbol: fillSymbol
          })
          view.graphics.addMany([polygon])
        })
        var tov = on.once(view, "click", function(evt){
          view.goTo(initCamera)


            var url = 'https://wms3.nve.no/map/rest/services/SkredHendelser/MapServer/1/query?'
            var options = {
              query: {
                // where: 'skredtype in (130,131,132,133,134,135,136,137,138,139)',
                where: '1=1',
                geometry:'{xmin: ' + pos1.x + ', ymin: ' + pos1.y + ', xmax: ' + pos2.x + ', ymax: ' + pos2.y + '}',
                geometryType: 'esriGeometryEnvelope',
                inSR:25833,
                spatialRel: 'esriSpatialRelIntersects',
                // outFields: 'skredType, skredNavn, stedsnavn,vaerObservasjonbeskrivelse, objektType, utlosningArsak, dokumentasjon',
                outFields: '*',
                returnGeometry:true,
                returnTrueCurves:false,
                outSR:25833,
                returnIdsOnly:false,
                returnCountOnly:false,
                returnZ:false,
                returnM:false,
                returnDistinctValues:false,
                returnExtentsOnly:false,
                f: 'geojson',
              },
              responseType: 'json'
            };
            esriRequest(url, options).then(function(response) {
              var item = response.data.features["0"]
              if(item){
                console.log(response);
                response.data.features.forEach(function(obj){
                  addResponseData(obj)
                })
              }
            })
          view.graphics.removeAll()
          test.remove()
          tov.remove()
          view.toolactive = false
          viewElement.style.cursor = 'default'
        })
      })
    })

    var meny = document.querySelector('#contextMenu')
    on(view, 'click', function (evt) {
      if (!view.toolactive){
        meny.classList.remove('skjult')
        meny.classList.remove('gjemt')
        meny.style.top = evt.y + 'px'
        meny.style.left = evt.x + 'px'
        var handle = on(view, 'drag', function(){
          fjernMeny()
          handle.remove()
        })
      }
    })

    // view.on('click', function(evt) {
    //   var hoydeDiv = document.querySelector("#hoydeinfo");
    //
    //   var pos = view.toMap({
    //     x:evt.x,
    //     y:evt.y
    //   });
    //
    //   var extent = queryExtent(pos,50)
    //
    //   var sirkel = new Circle({
    //     center: new Point({
    //       x: pos.x,
    //       y: pos.y,
    //       // z: pos.z + 100, Om man legger til Z vil symbolet automatisk bli plassert 3dimensjonalt
    //       spatialReference: {
    //         wkid: 25833
    //       }
    //     }),
    //     geodesic: false,
    //     radius: 50,
    //     radiusUnit: "meters",
    //     spatialReference: 25833,
    //     type: "polygon"
    //   })
    //
    //
    //
    //   var polygonGraphic = new Graphic({
    //     geometry: sirkel,
    //     symbol: fillSymbol
    //   })
    //
    //   // view.graphics.add(polygonGraphic)
    //
    //   console.log("Sirkel", sirkel)
    //
    //   var options = {
    //     query: {
    //       // where: 'skredtype in (130,131,132,133,134,135,136,137,138,139)',
    //       where: '1=1',
    //       geometry:'{xmin: ' + extent.xmin + ', ymin: ' + extent.ymin + ', xmax: ' + extent.xmax + ', ymax: ' + extent.ymax + '}',
    //       geometryType: 'esriGeometryEnvelope',
    //       inSR:25833,
    //       spatialRel: 'esriSpatialRelIntersects',
    //       // outFields: 'skredType, skredNavn, stedsnavn,vaerObservasjonbeskrivelse, objektType, utlosningArsak, dokumentasjon',
    //       outFields: '*',
    //       returnGeometry:true,
    //       returnTrueCurves:false,
    //       outSR:25833,
    //       returnIdsOnly:false,
    //       returnCountOnly:false,
    //       returnZ:false,
    //       returnM:false,
    //       returnDistinctValues:false,
    //       returnExtentsOnly:false,
    //       f: 'geojson',
    //     },
    //     responseType: 'json'
    //   };
    //
    //   var url = 'https://wms3.nve.no/map/rest/services/SkredHendelser/MapServer/1/query?'
    //   esriRequest(url, options).then(function(response) {
    //     var item = response.data.features["0"]
    //     if(item){
    //       console.log(item.geometry.coordinates["0"], item.geometry.coordinates["1"], item.properties);
    //       var grafikk = new Graphic({
    //         geometry: new Point({
    //             x: item.geometry.coordinates["0"],
    //             y: item.geometry.coordinates["1"],
    //             spatialReference: {
    //               wkid: 25833
    //             }
    //           }),
    //         symbol: markerSymbol,
    //         attributes: item.properties
    //       })
    //       view.graphics.add(grafikk)
    //     }
    //   })
    //
    //   var hoyde = bakke.queryElevation(pos)
    //   console.log('Høyde',hoyde)
    //   hoyde.then(function(res){
    //     hoydeDiv.innerHTML = 'x: ' + pos.x.toFixed(0) + ' <br />y: ' + pos.y.toFixed(0) + ' <br />moh: ' + res.geometry.z.toFixed(0)
    //
    //     copyToClipboard(pos.x.toFixed(0) + ', ' + pos.y.toFixed(0) + ', extent: ' + extent.xmin.toFixed(0) + ','  + extent.ymin.toFixed(0) + ','  + extent.xmax.toFixed(0) + ','  + extent.ymax.toFixed(0))
    //   })
    // })
  })
})
