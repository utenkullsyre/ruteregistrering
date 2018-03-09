// Script for å parse en xml-streng til en nodeliste som kan konverteres til euref89

require([
  "esri/request",
  "dojo/on",
  "dojo/domReady!"
], function(
  esriRequest,
  on
) {

  var resultsDiv = document.getElementById("resultsDiv");
  var input = document.getElementById("inputUrl");


  function hentSegment (string) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(string, "application/xml");

    var linjePkt = doc.querySelectorAll('trkpt')
    var segmentListe = Array.prototype.map.call(linjePkt, function (obj) {
      return [
        parseFloat(obj.attributes.lon.nodeValue),
        parseFloat(obj.attributes.lat.nodeValue)
      ]
    })
    return segmentListe
  }
  function readSingleFile(evt) {
          //  Retrieve the first (and only!) File from the FileList object
          var myFile = evt.target.files[0];
          var reader = new FileReader();
          reader.readAsText(myFile);
          reader.onload=function(){
            console.log(myFile);
            var t = reader.result
            var jaja = hentSegment(t)
            console.log("segment", jaja);
            leggTilSegment(jaja)
          }
      }

      document.getElementById('upload-file').addEventListener('change', readSingleFile, false);



//   function readSingleFile(evt) {
//   //Retrieve the first (and only!) File from the FileList object
//   var f = evt.target.files[0];
//   console.log(f);
//
//   if (f) {
//     var r = new FileReader();
//     r.onload = function(e) {
//
//       var contents = e.target.result;
//       console.log("skj",contents);
//       alert( "Got the file.n"
//             +"name: " + f.name + "n"
//             +"type: " + f.type + "n"
//             +"size: " + f.size + " bytesn"
//             + "starts with: " + contents.substr(1, contents.indexOf("n"))
//       );
//     }
//     console.log("Helvete");
//     // var test = r.readAsText(f);
//   } else {
//     alert("Failed to load file");
//   }
// }

function leggTilSegment(segmentListe){
  var geometries = {
    "geometryType" : "esriGeometryPolyline",
    "geometries" :
    [
      {
        "paths" :[
          segmentListe
        ]
      }
    ]
  }
  var string = JSON.stringify(geometries)

  /************************************************
   *
   * Define the 'options' for our request.
   *
   *************************************************/
  var options = {
    query: {
      inSR: 4263,
      outSR: 25833,
      geometries: string,
      transformForward: true,
      f: 'json'
    }
  };

  // var url = 'https://kart.tromso.kommune.no/arcgis/rest/services/Utilities/Geometry/GeometryServer/project?'
  var url = '  https://wms3.nve.no/map/rest/services/Utilities/Geometry/GeometryServer/project?'




  esriRequest(url, options)
  .then(function(response) {
    console.log('response', response);

  })
  .otherwise(function (error) {
    console.log(error);
  } )
}


  //
  //
  //
  // // Make the request on a button click using the
  // // value of the 'input' text.
  // on(btnQuery, "click", function() {
  //   var url = input.value;
  //   esriRequest(url, options).then(function(response) {
  //     console.log('response', response);
  //     var responseJSON = JSON.stringify(response, null, 2);
  //     resultsDiv.innerHTML = responseJSON;
  //   });
  // });
});
