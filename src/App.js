import React from "react";

import { loadModules } from "esri-loader";

import { Scene } from "@esri/react-arcgis";

const loaderOptions = {
  url: process.env.REACT_APP_HTTPS
    ? "https://js.arcgis.com/4.20"
    : "http://js.arcgis.com/4.20",
};

async function getClass(elevationLayer, exaggeration) {
  const [BaseElevationLayer] = await loadModules([
    "esri/layers/BaseElevationLayer",
  ]);
  // basically copied from here: https://developers.arcgis.com/javascript/latest/sample-code/layers-custom-elevation-exaggerated/
  return BaseElevationLayer.createSubclass({
    fetchTile: function (level, row, col, options) {
      return this._elevation
        .fetchTile(level, row, col, options)
        .then(function (data) {
          for (let i = 0; i < data.values.length; i++) {
            data.values[i] = data.values[i] * exaggeration;
          }

          return data;
        });
    },
    load: function () {
      this._elevation = elevationLayer;
      this.addResolvingPromise(
        this._elevation.load().then(function () {
          // get tileInfo, spatialReference and fullExtent from the elevation service
          // this is required for elevation services with a custom spatialReference
          this.tileInfo = this._elevation.tileInfo;
          this.spatialReference = this._elevation.spatialReference;
          this.fullExtent = this._elevation.fullExtent;
        })
      );
      return this;
    },
    properties: {
      elevationLayer: elevationLayer,
      exaggeration: exaggeration,
    },
  }).bind(this);
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      map: null,
      view: null,
    };
    this.handleMapLoad = this.handleMapLoad.bind(this);
  }

  handleMapLoad(map, view) {
    this.setState({ map: map, view: view });

    loadModules(["esri/layers/ElevationLayer"]).then(([ElevationLayer]) => {
      getClass(
        // this returns a new custom ElevationClass instance
        new ElevationLayer({
          url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/TopoBathy3D/ImageServer",
        }),
        50 //50x exaggeration
      ).then((ExaggerationClass) => {
        console.log("loading custom elevation");
        let elevationLayer = new ExaggerationClass();
        map.ground.layers = [elevationLayer];
      });
    });
  }
  render() {
    return (
      <div style={{ width: "100vw", height: "100vh" }}>
        <Scene
          loaderOptions={loaderOptions}
          onLoad={this.handleMapLoad}
          onFail={() => console.log("whoops")}
          mapProperties={{
            basemap: "satellite",
          }}
          viewProperties={{
            center: [-73.594, -16.534],
            zoom: 10,
          }}
        ></Scene>
      </div>
    );
  }
}

export default App;
