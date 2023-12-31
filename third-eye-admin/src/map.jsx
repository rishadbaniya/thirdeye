import "leaflet/dist/leaflet.css";

import React, { useEffect } from "react";
import { useRedirect } from "react-admin";

import { GeoJSON, MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

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

let markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/13484/13484237.png", // normal emoji icon
  iconSize: [40, 40],
  iconAnchor: [16, 32]
});

const center = [28.3949, 84.124]; // Kathmandu

const MapButton = ({ id }) => {
  const redirect = useRedirect();
  const handleClick = () => {
    const finalpath = `/groups/${id}`;
    redirect(finalpath);
  };
  return <button onClick={handleClick}>Dashboard</button>;
};

const GroupIcon = ({ lat, lon, id }) => {
  return (
    <Marker key={1} position={[lat, lon]} icon={markerIcon}>
      <Popup>
        <MapButton id={id}>Visit Group!</MapButton>
      </Popup>
    </Marker>
  );
};

const NepalMap = () => {
  const [geoJSON, setGeoJSON] = React.useState(null);
  // const redirect = useRedirect();
  // const handleClick = () => {
  //   // redirect(`/groups/${group_id}`);
  //   redirect(`/groups`);
  // };

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
      <GroupIcon lat={center[0]} lon={center[1]} id={1} />
    </MapContainer>
  );
};

export default NepalMap;
