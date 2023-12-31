// import jsonServerProvider from "ra-data-json-server";

// export const dataProvider = jsonServerProvider(
//   import.meta.env.VITE_JSON_SERVER_URL
// );

import simpleRestProvider from 'ra-data-simple-rest';

export const dataProvider = simpleRestProvider('http://localhost:8000');