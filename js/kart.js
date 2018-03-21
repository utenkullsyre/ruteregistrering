var kartView
var kart
var diverseResultat
var bakkeLag
var hitResultat
var sketchObjekt
var valgtExtent = {}
var itemVerdier = {}
var lag = {}
require([
  'esri/Map',
  'esri/views/MapView',
  'esri/Viewpoint',
  'esri/Basemap',
  'esri/geometry/Point',
  'esri/layers/TileLayer',
  'esri/layers/FeatureLayer',
  'esri/geometry/Extent',
  'esri/geometry/SpatialReference',
  'esri/widgets/LayerList',
  'esri/widgets/Locate',
  'esri/widgets/Search',
  'esri/Graphic',
  'esri/layers/GraphicsLayer',
  'esri/widgets/Sketch/SketchViewModel',
  'esri/views/2d/draw/Draw',
  'esri/layers/ElevationLayer',
  'esri/Ground',
  'esri/request',
  'esri/config',
  'dojo/on',
  'dojo/dom',
  'dojo/domReady!'

], function (
  Map, MapView, Viewpoint, Basemap, Point, TileLayer,
  FeatureLayer, Extent, SpatialReference,
  LayerList, Locate, Search, Graphic, GraphicsLayer, SketchViewModel, Draw,
  ElevationLayer, Ground, esriRequest, esriConfig, on, dom
) {
  esriConfig.request.corsEnabledServers.push("www.norgeskart.no");
  esriConfig.request.corsEnabledServers.push("ws.geonorge.no");
  esriConfig.request.corsEnabledServers.push("api.nve.no");
  esriConfig.request.corsEnabledServers.push("www.vegvesen.no");



  var graatone = new TileLayer({
    url: 'https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_EUREF89/GeocacheGraatone/MapServer',
    id: 'Gråtone',
    visible: true
  })
  var bilder = new TileLayer({
    url: 'https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_EUREF89/GeocacheBilder/MapServer',
    id: 'Bilder',
    visible: false
  })

  var topp = new FeatureLayer({
    id: 'fjell',
    portalItem: {
      id: "03ecdbb776314ca0b99388156da4cd41"
    },
    visible: true
  })

  var parkering = new FeatureLayer({
    id: 'parkering',
    portalItem: {
      id: "5b00dc4c792140f99af2fdd9978384e4"
    },
    visible: false
  })

  var rute = new FeatureLayer({
    id: 'rute',
    portalItem: {
      id: "b00c50e3181c48aa93b2087a6d4d586f"
    },
    visible: false
  })

  var grafikkLag = new GraphicsLayer({
    visible: true,
    id: 'Grafikklag'
  })

  var baseMap = new Basemap({
    baseLayers: [graatone, bilder],
    title: 'Bakgrunnskart',
    id: 'bakgrunnskart'
  })

   // Create a Map instance
  var map = new Map({
    basemap: baseMap,
    //  Rekkefølgen i liste bestemmer hvordan de blir tegnet. Første første, siste sist.
    layers: [rute, topp, parkering, grafikkLag]
  })

  var stateHandler = 'default';

  kart = map

  var startVindu = new Extent({
    xmin: 359715.6240792491,
    ymin: 7608796.799127923,
    xmax: 635390.8420963518,
    ymax: 7609135.466471925,
    spatialReference: new SpatialReference({wkid: 25833})
  })

  /************************************************************
   * Set the WebMap instance to the map property in a MapView.
   ************************************************************/
  var view = new MapView({
    map: map,
    container: 'toppViewDiv'
  })
  view.constraints.rotationEnabled = false

  var locateWidget = new Locate({
    view: view,   // Attaches the Locate button to the view
    graphic: new Graphic({
      symbol: { type: 'simple-marker' }  // overwrites the default symbol used for the
      // graphic placed at the location of the user when found
    })
  })

  var sokSymbol = {
    type: "simple-marker",
    outline: {
        width: 2.75,
        color: [255, 0, 0, 0.72]
      }
  };
  //  Sate-handler for å registrere hvilken registrerings-nivå man er på
  var regState = 'topp'

  var freehandIcon = document.querySelector('#freehandButton')
  var undoIcon = document.querySelector('#undoButton')

  kartView = view

  view.when(function () {
    view.extent = startVindu
  })
  view.ui.move('zoom', 'top-right')
  view.ui.add('nyTopp', 'bottom-right')
  view.ui.add('nyParkering', 'bottom-right')
  view.ui.add('nyRute', 'bottom-right')
  view.ui.add('freehandButton', 'bottom-right')
  view.ui.add('undoButton', 'bottom-right')
  view.ui.add('resetBtn', 'bottom-right')
  //  test = view;

  document.querySelector('#kartmodal > div.dimmed').addEventListener('click', function(evt){
    evt.target.parentElement.classList.add('borte')
  })

  function stedsSok (evt) {
    if(evt.target.value.length>0){
      var url = "https://ws.geonorge.no/SKWS3Index/v2/ssr/sok?"
      if(evt.target.value.split(",")[1]){
        var inputNavn = evt.target.value.split(",")[0];
        var inputEkstra = evt.target.value.split(",")[1];
      } else {
        var inputNavn = evt.target.value;
        var inputEkstra = "";
      }
      var options = {
          query: {
            navn: inputNavn + "*",
            fylkeKommuneNavnListe: inputEkstra,
            eksakteForst:true,
            antPerSide:15,
            epsgKode:25833,
          },
          responseType: 'xml'
        };
        return esriRequest(url, options)
    }}

  view.when(function () {
    fjernLoader();
    console.log(view);
    var velgnytopp = document.querySelector('[name="velgnytopp"]')
    var velgtopp = document.querySelector('[name="velgtopp"]')
    var baseToggle = document.querySelector('#baseToggle')
    var img = document.querySelectorAll('#baseToggle img')
    var nytoppknapp = document.querySelector('#nyTopp')
    var toppinfoDiv = document.querySelector('#toppinfo')
    var formFjellWrapper = document.querySelector('#fjelltopFormWrapper')
    var toppFormDiv = document.querySelector('[name= "toppregistrering"]')
    var toppinfoKnapp = document.querySelector('#toppdetaljer')
    var parkeringinfoDiv = document.querySelector('#parkeringinfo')
    var parkeringinfoKnapp = document.querySelector('#parkeringregistrering')
    var valgtToppInfo = document.querySelector('[name="valgt-topp-info"]')
    var registrerTopp = document.querySelector('[name="regnytopp"]')
    var parkeringkartDiv = document.querySelector('#parkeringViewDiv')
    var ruteinfoDiv = document.querySelector('#ruteinfo')
    var viewDivTest = document.querySelector('#toppViewDiv');
    var valgtToppInfo = document.querySelector('[name="valgt-topp-info"]');
    var nytoppknapp = document.querySelector('#nyTopp');
    var uiComponents = document.querySelector('#toppViewDiv > div.map-ui-component');
    var sokinput = document.querySelector('.map-ui-component input[type=text]')
    var undoKnapp = document.querySelector('#undoButton');
    var friKnapp = document.querySelector('#freehandButton');
    var resetKnapp = document.querySelector('#resetBtn');
    var currentLayer = topp
    console.log(sokinput);

    var draw = new Draw({
      view: view
    })

    var valgInformasjon = {}
    // uiComponents.push(view.ui.container)

    // console.log(velgnytopp);
    var valgtToppResultatNoder = Array.prototype.map.call(valgtToppInfo, function (obj) {
            console.log(obj);
          })

    view.cursor = 'pointer'

    function setActiveButton (selectedButton) {
   // focus the view to activate keyboard shortcuts for sketching
      view.focus()
      var elements = document.querySelectorAll('.aktiv')
      Array.prototype.map.call(elements, function (obj) {
        obj.classList.remove('aktiv')
      })

      if (selectedButton) {
        selectedButton.classList.add('aktiv')
      }
    }

    function resetKart(view){
      stateHandler = 'default'
      grafikkLag.removeAll();
      var fetthaal = view.ui.container
      fetthaal.classList.remove('borte');
      uiComponents.classList.remove('borte');
      view.container.classList.remove('halv-aapen');
      valgtToppInfo.classList.add('borte');
      currentLayer.definitionExpression = null;
      view.map.layers.items.map(function(obj){
        obj.opacity = 1
      })
      currentLayer.visible = true
      view.cursor = 'pointer'
      console.log('Kart resett');
    }

    function registreringsViz(view){
      grafikkLag.removeAll();
      currentLayer.opacity = 0.3;
      view.cursor = 'crosshair'
    }

    function leggTilPkt(kartpkt){
      var point = {
        type: "point",  // autocasts as new Point()
        x: kartpkt.x,
        y: kartpkt.y,
        spatialReference: {
          wkid: 25833
        }
      };
      // autocasts as new PictureMarkerSymbol()
      var markerSymbol = {
          type: "picture-marker",
          url: "./img/mountain.png",
          width: 19.5,
          height: 19.5
      };
      var grafikk = new Graphic({
        geometry: point,
        symbol: markerSymbol
      })
      return grafikk
    }

    function visRedKnapper(state) {
      var knapper = [undoKnapp, friKnapp, resetKnapp]
      if (state === 'on') {
        knapper.map(function(obj){
          obj.classList.remove('borte')
          setTimeout(function(){
            obj.classList.remove('hide')
          }, 50)
        })
      } else if (state === 'off') {
        knapper.map(function( obj ){
          obj.classList.add('hide')
          setTimeout(function () {
            obj.classList.add('borte')
          }, 50)
        })
      }
    }

    function enableCreatePolyline(draw, view) {
      var action = draw.create("polyline");

      // listen to PolylineDrawAction.vertex-add
      // Fires when the user clicks, or presses the "F" key
      // Can also fire when the "R" key is pressed to redo.
      action.on("vertex-add", function (evt) {
        createPolylineGraphic(evt.vertices);
      });

      // listen to PolylineDrawAction.vertex-remove
      // Fires when the "Z" key is pressed to undo the
      // last added vertex
      action.on("vertex-remove", function (evt) {
        createPolylineGraphic(evt.vertices);
      });

      // listen to PolylineDrawAction.cursor-update
      // fires when the pointer moves over the view
      action.on("cursor-update", function (evt) {
        createPolylineGraphic(evt.vertices);
      });

      // listen to PolylineDrawAction.draw-complete
      // event to create a graphic when user double-clicks
      // on the view or presses the "C" key
      action.on("draw-complete", function (evt) {
        var grafikk = createPolylineGraphic(evt.vertices);
        console.log(grafikk);
        viewDivTest.classList.add('halv-aapen')
        toggleUi(view, 'off')
        vmRuteInfo.lagretGrafikk = grafikk
        visRedKnapper('off')
        setActiveButton()
      });
    }

    function createPolylineGraphic(vertices){
      view.graphics.removeAll();
      var polyline = {
        type: "polyline", // autocasts as Polyline
        paths: vertices,
        spatialReference: view.spatialReference
      };
      var graphic = new Graphic({
        geometry: polyline,
        symbol: {
          type: "simple-line", // autocasts as SimpleLineSymbol
          color: [255, 0, 0],
          width: 3,
          cap: "round",
          join: "round"
        }
      });
      view.graphics.add(graphic);
      return graphic
    }

    function hentToppInfo (x,y) {
      var urlSted = 'https://www.norgeskart.no/ws/elev.py?'
      var options = {
        query: {
          lat: y,
          lon: x,
          epsg: 25833
        }
      }
      return esriRequest(urlSted, options)
    }

    function skiftRegnivaa(registreringsnivaa){
      //  Loope gjennom alle tittel-knapper og sette den riktige til aktiv
      Array.prototype.map.call(document.querySelectorAll('.accordion'), function(obj){
        console.log(obj.dataset.regtype);
        if(obj.dataset.regtype === registreringsnivaa){
          obj.classList.add('active')
        } else {
          obj.classList.remove('active')
        }
      })
      //  Loope gjennom alle 'panel' - objekt og skru av de som ikke har regtype === regstatus (bruker ternarny)'
      Array.prototype.map.call(document.querySelectorAll('.panel'), function(obj){
        console.log(obj.dataset.regtype);
        if(obj.dataset.regtype === registreringsnivaa){
          obj.classList.remove('borte')
          obj.classList.add('aapen')
        } else {
          obj.classList.add('borte')
        }
      })
      //  Loope gjennom knapper i kart og skru av de som ikke stemmer med registreringsstatus
      Array.prototype.map.call(document.querySelectorAll('.action-button'), function(obj){
        if (obj.dataset.regtype === registreringsnivaa) {
          obj.classList.remove('borte')
        } else {
          obj.classList.add('borte')
        }
      })
      //  Loope gjennom kartlag og aktivere de
      view.map.layers.items.map(function(obj){
        console.log(obj);
        if (obj.id === registreringsnivaa) {
          obj.visible = true
          currentLayer = obj
        } else {
          obj.visible = false
        }
      })
    }

    function toggleUi(view, tilstand){
      if (tilstand === 'on') {
        stateHandler = 'default'
        grafikkLag.removeAll();
        var fetthaal = view.ui.container
        fetthaal.classList.remove('borte');
        uiComponents.classList.remove('borte');
        topp.definitionExpression = null;
        topp.opacity = 1;

      } else if (tilstand === 'off') {
        uiComponents.classList.add('borte')
        viewDivTest.classList.add('halv-aapen')
        view.ui.container.classList.add('borte')
      }
    }
    view.container.addEventListener('keydown', function(evt){
      console.log(evt);
      if (evt.ctrlKey && evt.keyCode === 188) {
        console.log("View",view);
        view.map.layers.map(function(obj){
          console.log(obj);
          obj.visible = true
        })
      }
    })

    view.container.addEventListener('keydown', function(evt){
      if (evt.key === 'Backspace' && draw.activeAction) {
        draw.activeAction.undo()
      }
    })

    on(sokinput, 'key-up', function () {
      alert('dfghdfghdfgh')
      document.querySelector('#sokResultat').classList.remove('borte')
    })

    //  Setter opp event handler for når man klikker i kartet
    on(view, 'click', function(event) {
      console.log(event);
      var hittest = {}
      view.hitTest(event)
      .then(function(response){
        console.log(response);
        hittest = response
        if (response.results.length > 0 && stateHandler === 'default') {
          //  Fjern ui, halver karthøyde, stopp vanlig oppførsel og zoom til valgt pkt
          var resultat = response.results[0].graphic.attributes;
          event.stopPropagation();
          view.ui.container.classList.add('borte')
          uiComponents.classList.add('borte')
          console.log(uiComponents.classList);
          view.goTo({
            target: event.mapPoint
          })
          viewDivTest.classList.add('halv-aapen')
          //  Hvis friluftstype er lik fjell, oppdater vue info for fjell-info
          if (resultat.friluftstype === 'topp') {
            vmValgResultatFjell.valgttopp.navn = resultat.navn.length > 0 ? resultat.navn : "Ikke registrert navn"
            vmValgResultatFjell.valgttopp.hoyde = resultat.hoyde
            vmValgResultatFjell.valgttopp.beskrivelse = resultat.beskrivelse.length > 0 ? resultat.beskrivelse : "Ikke registrert beskrivelse"
            vmValgResultatFjell.valgttopp.merknad = resultat.merknad.length > 0 ? resultat.merknad : "Ingen registrert merknad"
            currentLayer.definitionExpression = 'OBJECTID = ' + resultat.OBJECTID
            vmToppReg.fjellId = resultat.OBJECTID
            valgtToppInfo.classList.remove('borte')
          //  Hvis friluftstype er lik parkering oppdater vue infor for parkering-info
          } else if (resultat.friluftstype === 'parkering') {
            console.log(resultat);
            vmParkeringInfo.valgtparkering.navn = resultat.navn ? resultat.navn : 'Ikke registrert navn'
            vmParkeringInfo.valgtparkering.friluftstype = resultat.friluftstype
            vmParkeringInfo.valgtparkering.broytet = resultat.broytet ? resultat.broytet : 'Ikke registrert'
            vmParkeringInfo.valgtparkering.merknad = resultat.merknad ? resultat.merknad : 'Ingen registrert merknad'
            vmParkeringInfo.valgtparkering.plasser = resultat.antallplasser ? resultat.antallplasser : 'Ikke registrert'
            currentLayer.definitionExpression = 'OBJECTID = ' + resultat.OBJECTID
            vmParkeringInfo.parkeringsId = resultat.OBJECTID
          }
          //  Hvis ingen av de ovenfor matcher, gjør dette
          else {
            }
          }
        else if (response.results.length === 0 && stateHandler === 'nyTopp') {
        console.log('Statehandler = ' + stateHandler);
        grafikkLag.removeAll();
        var grafikk = leggTilPkt(event.mapPoint)
        vmToppReg.lagretGrafikk = grafikk;
        grafikkLag.graphics.add(grafikk)
        view.goTo({
          target: grafikk
        })
        .then(function(response){
          viewDivTest.classList.add('halv-aapen')
          toggleUi(view, 'off')
          // TODO: Erstatt dette med vue-opplegg slik som på parkering og rute
          formFjellWrapper.classList.remove('borte')
          formFjellWrapper.classList.add('aapen')
          currentLayer.opacity = 1
          currentLayer.visible = false
          hentToppInfo(event.mapPoint.x,event.mapPoint.y)
          .then(function(response){
            if (document.querySelector('[name="toppnavn"]').value.length === 0) {
              console.log('Fjelltoppinfo',response);
              vmToppReg.fjellSkjema.navn.verdi = response.data.placename
              vmToppReg.fjellSkjema.hoyde.verdi = Math.round(response.data.elevation)
            }
          })
          console.log(view);
        })
        //  Logikk for hva som skal skje om state er at man skal registrere en ny parkering
        } else if (response.results.length === 0 && stateHandler === 'nyParkering') {
          console.log('Statehandler = ' + stateHandler);
          grafikkLag.removeAll();
          var grafikk = leggTilPkt(event.mapPoint)
          vmParkeringInfo.lagretGrafikk = grafikk;
          grafikkLag.graphics.add(grafikk)
          grafikkLag.visible = true
          view.goTo({
            target: grafikk
          })
          .then(function(response){
            viewDivTest.classList.add('halv-aapen')
            toggleUi(view, 'off')
            currentLayer.opacity = 1
            currentLayer.visible = false
            console.log(view);
          })
        }
        else if (response.results.length === 0 && stateHandler === 'nyRute') {
          console.log('Statehandler = ' + stateHandler);
          // grafikkLag.removeAll();
          // Legg til linjegrafikk
          // vmToppReg.lagretGrafikk = true;
          // grafikkLag.graphics.add(grafikk)
          // view.goTo({
          //   target: grafikk
          // })
          // .then(function(response){
          //   // viewDivTest.classList.add('halv-aapen')
          //   // toggleUi(view, 'off')
          //   // formFjellWrapper.classList.remove('borte')
          //   // formFjellWrapper.classList.add('aapen')
          //   // topp.opacity = 1
          //   // topp.visible = false
          //   console.log(view);
          // })
        } else {
          // view.container.classList.add('borte')
          // view.container = null
        }
      }).otherwise(function(error){
        console.log(error);
      })
    })
    //  Event handler for å registrere ny fjelltopp
    on(document.querySelector('#nyParkering'), 'click', function (event) {
      console.log(view);
      view.graphics.removeAll();
      grafikkLag.graphics.removeAll();
      registreringsViz(view)
      stateHandler = 'nyParkering'
    })

    // Event handler for å registrere ny rute
    on(document.querySelector('#nyRute'), 'click', function (event) {
      console.log(view);
      parkering.visible = true;
      parkering.definitionExpression = vmParkeringInfo.parkeringID
      view.graphics.removeAll();
      grafikkLag.graphics.removeAll();
      grafikkLag.visible = true
      grafikkLag.opacity = 1
      // view.map.layers.items.map(function(obj){
      //   obj.opacity = 1
      // })
      setActiveButton(this)
      visRedKnapper('on')
      registreringsViz(view)
      stateHandler = 'nyRute'
      enableCreatePolyline(draw, view)
      draw.activeAction._dragEnabled = false
    })

    on(friKnapp, 'click', function (evt) {
      this.classList.toggle('aktiv')
      if (draw.activeAction) {
        draw.activeAction._dragEnabled = !draw.activeAction._dragEnabled
      }
    })

    on(undoKnapp, 'click', function (evt) {
      if (draw.activeAction) {
        draw.activeAction.undo()
      }
    })

    on(resetKnapp, 'click', function (evt) {
      view.graphics.removeAll();
      setActiveButton();
      visRedKnapper('off')
      draw.reset()
    })

    on(nytoppknapp, 'click', function (event) {
      console.log(view);
      view.graphics.removeAll();
      grafikkLag.graphics.removeAll();
      registreringsViz(view)
      // TODO: Gjør om denne til switch-logikk etterhvert
      if (regState === 'topp') {
        stateHandler = 'nyTopp'
        console.log(stateHandler);
      } else if (regState === 'parkering') {
        console.log('Parkeringsregistrering')

      } else if  (regState === 'rute') {

      } else {
        console.log('What!?=');
      }

    })



    var vmInfoBoard = new Vue({
      el: '#sokInfo',
      data: {
        sokSynlig: false,
        infoboksSynlig: false,
        lasteSymbol: false,
        stedsNavn: '',
        hoyde: '....',
        vaerUrl: '',
        solUrl: '',
        snackbarSynlig: false,
        snackTitle: 'Tittel',
        snackMessage: 'Snackmelding her',
        antObjekter: 0,
        resultatSynlig: false,
        resultat: []
      },
      methods: {
        lukkInfo: function () {
          this.infoboksSynlig = false;
          this.stedsNavn = '';
          this.hoyde = '....';
        },
        stedSok: function (evt) {
          if(evt.target.value.length>0){
            var url = "https://ws.geonorge.no/SKWS3Index/v2/ssr/sok?"
            if(evt.target.value.split(",")[1]){
              var inputNavn = evt.target.value.split(",")[0];
              var inputEkstra = evt.target.value.split(",")[1];
            } else {
              var inputNavn = evt.target.value;
              var inputEkstra = "";
            }
            var options = {
                query: {
                  navn: inputNavn + "*",
                  fylkeKommuneNavnListe: inputEkstra,
                  eksakteForst:true,
                  antPerSide:15,
                  epsgKode:25833,
                },
                responseType: 'xml'
              };
              esriRequest(url, options)
              .then(function(response) {
                var resultat = []
                Array.prototype.map.call(response.data.childNodes["0"].childNodes,function(obj){
                  if (obj.localName === "stedsnavn"){
                    el = obj
                    var stedsnavnObjekt = {}
                    stedsnavnObjekt.navn = obj.childNodes[4].innerHTML;
                    stedsnavnObjekt.type = obj.childNodes[1].innerHTML.toLowerCase();
                    stedsnavnObjekt.kommune = obj.childNodes[2].innerHTML;
                    stedsnavnObjekt.fylke = obj.childNodes[3].innerHTML;
                    stedsnavnObjekt.x = obj.childNodes[5].innerHTML;
                    stedsnavnObjekt.y = obj.childNodes[6].innerHTML;
                    stedsnavnObjekt.epsg = obj.childNodes[10].innerHTML;
                    stedsnavnObjekt.stedsnr = obj.childNodes[11].innerHTML;
                    resultat.push(stedsnavnObjekt)
                  }
                })
                // TODO: Bytt ut denne blokka med ternary operator
                vmInfoBoard.resultatSynlig = true;
                vmInfoBoard.resultat = resultat;
                vmInfoBoard.stedsNavn = evt.target.value;
              })
              .otherwise(function (error) {
                console.log(error);
              })

          }
        },
        slaaOppSted: function(evt){
          vmInfoBoard.stedsNavn = evt.target.innerHTML;

          console.log(vmInfoBoard);
          var pos = {
            x: parseInt(evt.target.attributes["data-x"].value),
            y: parseInt(evt.target.attributes["data-y"].value)
          }

          // console.log("Point", pos);

          var grafikk = new Graphic({
            geometry: new Point({
                x: pos.x,
                y: pos.y,
                spatialReference: {
                  wkid: 25833
                }
              }),
            symbol: sokSymbol
          })
          view.graphics.removeAll()
          view.graphics.add(grafikk)
          var viewpoint = new Viewpoint({
            targetGeometry: grafikk.geometry,
            scale: 30000,
            heading: 20,
            tilt: 50
          })

          var options = {
            easing: "in-out-cubic",
          }
          view.goTo(viewpoint, options)
          vmInfoBoard.resultat = [];
          vmInfoBoard.stedsNavn = null

        },
        lukkSok: function() {
          this.resultatSynlig = false;
          this.resultat = [];
          this.stedsNavn = '';
        }
      }
    })

    var vmToppReg = new Vue({
      el: '#fjelltopFormWrapper',
      data: {
        fjellId: null,
        lagretGrafikk: false,
        fjellSkjema: {
          navn: {
            verdi: null,
            bekreftet: false
          },
          hoyde: {
            verdi: null,
            bekreftet: false
          },
          beskrivelse: null,
          merknad: null
        }
      },
      methods: {
        registrerTopp: function () {
          if (this.lagretGrafikk) {
            var grafikk = this.lagretGrafikk
            var attributter = {
              'navn': this.fjellSkjema.navn.verdi,
              'hoyde': this.fjellSkjema.hoyde.verdi,
              'beskrivelse': this.fjellSkjema.beskrivelse,
              'merknad': this.fjellSkjema.merknad,
              'friluftstype': 'topp'
            }
            grafikk.attributes = attributter
            var edits = {
              addFeatures: [grafikk]
            }
            console.log(grafikk);
            topp.applyEdits(edits)
            .then(function(response){
              if (response.addFeatureResults["0"].objectId) {
                this.fjellId = response.addFeatureResults["0"].objectId
                vmValgResultatFjell.velgtopp();
              } else {
                console.log('!!Finner ikke fjellID, se logg!!', response);
              }
            })
            .otherwise(function (error) {
              console.log(error)
            })
          }
        },
        resetkart: function () {
          resetKart(view);
          this.tomSkjema();
          this.lagretGrafikk = false;
        },
        tomSkjema: function () {
          this.fjellSkjema = {
            navn: {
              verdi: null,
              bekreftet: false
            },
            hoyde: {
              verdi: null,
              bekreftet: false
            },
            beskrivelse: null,
            merknad: null
          }
        }
        // registrerFF: function () {
        //
        // }
      }
    })

    var vmValgResultatFjell = new Vue({
      el: '#valgtFjelltopp',
      data: {
        valgttopp: {
          navn: '',
          hoyde: null ,
          beskrivelse: '',
          merknad: 'Ingen registrerte merknader'
        }
      },
      methods: {
        velgnytopp: function () {
          this.resetValgtTopp();
          resetKart(view);
          view.goTo({
            target: event.mapPoint
          }).then(function(){
            view.focus()
          })
        },
        //  Bekrefter valgt topp og går videre til Parkeringsregistrering
        velgtopp: function () {
          // toppinfoKnapp.classList.remove('active')
          // toppinfoDiv.classList.remove('aapen')
          // parkeringinfoDiv.classList.add('aapen')
          // parkeringinfoKnapp.classList.add('active')
          regState = 'parkering'
          resetKart(view)
          parkeringinfoDiv.insertBefore(viewDivTest, document.querySelector('#parkeringInfoWrapper'))
          skiftRegnivaa(regState)
          // topp.visible = false;
          // parkering.visible = true;
        },
        registrerTopp: function(event) {
          resetKart(view, event.mapPoint);
          topp.opacity = 1;
          topp.definitionExpression = ''
        },
        resetValgtTopp: function(){
          this.valgttopp = {
            navn: '',
            hoyde: null ,
            beskrivelse: '',
            merknad: 'Ingen registrerte merknader'
          }
        }
      }
    })
    // Vue instance for parkeringsinformasjon
    var vmParkeringInfo = new Vue({
      el: '#parkeringInfoWrapper',
      data: {
        lagretGrafikk: null,
        parkeringsId: null,
        parkeringSkjema: {
          navn: null,
          antallplasser: null,
          broytet: null,
          merknad: null
        },
        valgtparkering: {
          navn: null,
          plasser: null,
          broytet: null,
          merknad: null,
          friluftstype: null
        }
      },
      methods: {
        registrerParkering: function () {
          console.log(this.lagretGrafikk);
          if (this.lagretGrafikk) {
            var grafikk = this.lagretGrafikk
            var attributter = {
              antallplasser: this.parkeringSkjema.antallplasser,
              broytet: this.parkeringSkjema.broytet,
              merknad: this.parkeringSkjema.merknad,
              navn: this.parkeringSkjema.navn,
              friluftstype: 'parkering'
            }
            grafikk.attributes = attributter
            var edits = {
              addFeatures: [grafikk]
            }
            console.log(grafikk);
            parkering.applyEdits(edits)
            .then(function (response) {
              if (response.addFeatureResults["0"].objectId) {
                this.parkeringsId = response.addFeatureResults["0"].objectId
                vmParkeringInfo.velgparkering();
                topp.definitionExpression = vmToppReg.fjellId;
                parkering.definitionExpression = vmParkeringInfo.parkeringID;
                console.log(topp, parkering);
                // topp.visible = true
                // parkering.visible = true
                console.log(vmParkeringInfo.parkeringID, vmToppReg.fjellId);
              } else {
                console.log('!!Finner ikke parkeringID, se logg!!', response);
              }
            })
            .otherwise(function (error) {
              console.log(error)
            })
          }
        },
        velgparkering: function () {
          topp.definitionExpression = vmToppReg.fjellId
          parkering.definitionExpression = vmParkeringInfo.parkeringsId
          topp.visible = true
          parkering.visible = true
          console.log(vmToppReg.fjellId, vmParkeringInfo.parkeringsId);
          regState = 'rute'
          resetKart(view)
          document.querySelector('#ruteinfo').insertBefore(viewDivTest, document.querySelector('#ruteInfoWrapper'))
          skiftRegnivaa(regState)
          currentLayer.opacity = 0.3;
        },
        velgnyparkering: function () {
          this.resetValgtParkering();
          resetKart(view);
          view.goTo({
            target: event.mapPoint
          }).then(function(){
            view.focus()
          })
        },
        resetValgtParkering: function () {
          this.resetkart();
          vmParkeringInfo.valgtparkering = {
            navn: null,
            plasser: null ,
            broytet: null,
            merknad: null,
            friluftstype: null
          }
        },
        resetkart: function () {
          vmParkeringInfo.lagretGrafikk = false;
          stateHandler = 'default'
          grafikkLag.removeAll();
          view.graphics.removeAll();
          view.ui.container.classList.remove('borte');
          uiComponents.classList.remove('borte');
          view.container.classList.remove('halv-aapen');
          currentLayer.definitionExpression = null;
          view.map.layers.items.map(function(obj){
            obj.opacity = 1
          })
          currentLayer.visible = true
          view.cursor = 'pointer'
          console.log('Kart resett');
        }
      }
    })

    //  Vue instance for ruteregistrering
    var vmRuteInfo = new Vue({
      el: '#ruteinfo',
      data: {
        lagretGrafikk: null,
        lagretRuteID: null
      },
      methods: {
        registrerRute: function(event) {
          resetKart(view, event.mapPoint);
          //  Apply edits lagretGrafikk
          currentLayer.opacity = 1;
          currentLayer.definitionExpression = ''
        },
        resetkart: function () {
          vmParkeringInfo.lagretGrafikk = false;
          stateHandler = 'default'
          grafikkLag.removeAll();
          view.graphics.removeAll();
          view.ui.container.classList.remove('borte');
          uiComponents.classList.remove('borte');
          view.container.classList.remove('halv-aapen');
          currentLayer.definitionExpression = null;
          view.map.layers.items.map(function(obj){
            obj.opacity = 1
          })
          currentLayer.visible = true
          view.cursor = 'pointer'
          console.log('Kart resett');
        }
      }
    })
     // baseToggle.classList.remove('hide')
    // bilder.load().then(function () {
    //   map.allLayers.items.forEach(function (element) {
    //     lag[element.title] = element
    //   })
    //   baseToggle.addEventListener('click', function () {
    //     img[0].classList.toggle('hide')
    //     img[1].classList.toggle('hide')
    //
    //     lag.GeocacheBilder.visible = !lag.GeocacheBilder.visible
    //     lag.GeocacheTrafikkJPG.visible = !lag.GeocacheTrafikkJPG.visible
    //   })
    // })
  }).otherwise(function(error){
    console.log('Kartlastningmelding', error);
  })

  function oppdaterFeatureLayer (skjemaItems, grafikk, featurelag) {
    Array.prototype.map.call(skjemaItems, function (obj) {
      itemVerdier[obj.name] = obj.value
    })

    var dato = new Date(itemVerdier['aar'], itemVerdier['mnd'] - 1, 1, 12, 0)

    var attributter = {
      'Prosjektnavn': itemVerdier['prosjektnavn'],
      'Vegavdeling': itemVerdier['vegavdeling'],
      'Seksjon': itemVerdier['seksjon'],
      'Epost': itemVerdier['epost'],
      'Vegreferanse': itemVerdier['vegreferanse'],
      'Kontaktperson': itemVerdier['kontaktperson'].replace(/\b\w/g, function (l) { return l.toUpperCase() }),
      'Ferdigdato': dato
    }

    grafikk.attributes = attributter

    var edits = {
      addFeatures: [grafikk]
    }

    featurelag.applyEdits(edits).otherwise(function (error) {
      console.log(error)
    })
  }

  document.getElementById('sendinn').addEventListener('click', function () {
    if (view.graphics.length > 0 && skjemaValidering()) {
      document.querySelector('#prosjektVerdi').innerHTML = document.querySelector('[name="prosjektnavn"]').value
      var grafikk = view.graphics
      var grafikkArray = []

      //  Hvis registrert grafikk er linje, gjør noe logikk
      if (grafikk.items[0].symbol.type === 'simple-line') {
        if (grafikk.length > 1) {
        } else {
          grafikkArray = [grafikk.items[0]]
        }
        // oppdaterFeatureLayer(skjemaItems, grafikk.items[0], linje)

      //  Hvis registrert grafikk er polygon, gjør noe annen logikk
      } else if (grafikk.items[0].symbol.type === 'simple-fill') {
        // oppdaterFeatureLayer(skjemaItems, grafikk.items[0], flate)
      }

      //  Fjern aktiv, åpen og andre markør-klasser
      fjernCss()
      form.reset()
      vegrefView.extent = startVindu
      view.extent = startVindu
      this.classList.add('active')
      this.nextElementSibling.classList.add('aapen')
      lag.GeocacheBilder.visible = false
      lag.GeocacheTrafikkJPG.visible = true
      view.graphics.removeAll()
    } else {
      document.querySelector('#kart .errorMessage').innerHTML = '<p>Prosjektinfo er ikke fyllt ut eller stedfestet</p>'
    }
  //  if(view.graphics)
  //  view.graphics.removeAll();
  })
  function fjernLoader(){
    //velg elementer
    var viewDivTest = document.querySelector('#toppViewDiv');
    var loader = document.querySelector('#loader')
    var bilde = document.querySelector('#loader img')
    //Fjern loader
    setTimeout(function () {
      loader.classList.toggle('gjemt');
      bilde.classList.remove('roter-bilde')
      bilde.classList.add('scale');
      setTimeout(function () {
        loader.classList.toggle('skjult');
        viewDivTest.removeChild(loader);
      }, 1000)
    }, 2000)
  }
})
