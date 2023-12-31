import "leaflet/dist/leaflet.css";

import React, { useEffect } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";

const geojsonPath = "/assets/geoJSON-Nepal/nepal-districts-new.geojson";

const mapStyle = {
  width: "100%",
  height: "100%",
  margin: "10px auto"
  // padding: "10px"
};

const countryBounds = [
  [26.347, 80.058], // Southwestern corner
  [30.447, 88.201] // Northeastern corner
];

const center = [28.3949, 84.124]; // Kathmandu

const NepalMap = () => {
  const [geoJSON, setGeoJSON] = React.useState(null);
  useEffect(() => {
    const fetchGeoJSON = async () => {
      const response = await fetch(geojsonPath);
      const json = await response.json();
      setGeoJSON(json);
    };
    fetchGeoJSON();
  }, []);
  return (
    <MapContainer
      style={mapStyle}
      center={center}
      zoom={8}
      minZoom={8}
      maxBounds={countryBounds}
      maxBoundsViscosity={1.0}
    >
      {geoJSON && (
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      )}
      {geoJSON && (
        <GeoJSON
          data={geoJSON}
          style={() => {
            return {
              color: "black",
              weight: 1,
              fillColor: "grey",
              fillOpacity: 0.5
            };
          }}
        />
      )}
    </MapContainer>
  );
};

export default NepalMap;
