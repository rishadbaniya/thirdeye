import { fetchUtils } from "react-admin";
import { addRefreshAuthToDataProvider } from "react-admin";
import restDataProvider from "ra-data-rest-client";
import { refreshAuth } from "./auth/authProvider";
import axios from "axios";

const RESTAPI_URL = "http://localhost:8000";

const dataProvider = (access_token: string) => {
  let httpClient = (url: any, options: any = {}) => {
    if (!options.headers) {
      options.headers = new Headers({ Accept: "application/json" });
    }
    options.headers.set("Authorization", `${access_token}`);
    return fetchUtils.fetchJson(url, options);
  };
  return restDataProvider(RESTAPI_URL, httpClient);
};

const refreshRestDataProvider = (access_token: string) => {
  //return addRefreshAuthToDataProvider(dataProvider(access_token), refreshAuth);
  return dataProvider(access_token);
};

//export default refreshRestDataProvider;

// Create an instance of Axios with custom configuration
const axios_http_client = (access_token: string) =>
  axios.create({
    baseURL: RESTAPI_URL,
    timeout: 5000,
    headers: {
      Authorization: `${access_token}`,
      "Content-Type": "application/json",
    },
  });

const db = (access_token: string) => {
  return {
    // get a list of records based on sort, filter, and pagination
    getList: (resource, params) => {
      console.log(resource, params);

      let resp = new Promise((resolve, reject) => {
        axios_http_client(access_token)
          .get(`/${resource}`)
          .then((d) => {
            resolve({ ...d.data });
          })
          .catch((err) => {
            reject(err);
          });
      });

      return resp;
    },
    // get a single record by id
    getOne: (resource, params) => {
      console.log(resource, params);

      let resp = new Promise((resolve, reject) => {
        axios_http_client(access_token)
          .get(`/${resource}/${params.id}`)
          .then((d) => {
            resolve({ data: { ...d.data } });
          })
          .catch((err) => {
            reject(err);
          });
      });

      return resp;
    },
    // get a list of records based on an array of ids
    getMany: (resource, params) => Promise,
    // get the records referenced to another record, e.g. comments for a post
    getManyReference: (resource, params) => Promise,
    // create a record
    create: (resource, params) => {
      console.log(resource, params);

      let resp = new Promise((resolve, reject) => {
        console.log(params);
        axios_http_client(access_token)
          .post(`/${resource}`, params.data)
          .then((d) => {
            resolve({ data: { ...params.data, id: d.data } });
          })
          .catch((err) => {
            reject(err);
          });
      });

      return resp;
    },
    // update a record based on a patch
    update: (resource, params) => {
      console.log(resource, params);

      console.log(params);
      let resp = new Promise((resolve, reject) => {
        console.log(params);
        axios_http_client(access_token)
          .put(`/${resource}/${params.previousData.email}`, params.data)
          .then((d) => {
            resolve({ data: { ...params.data, id: d.data } });
          })
          .catch((err) => {
            reject(err);
          });
      });

      return resp;
    },
    // update a list of records based on an array of ids and a common patch
    updateMany: (resource, params) => Promise,

    delete: (resource, params) => {
      console.log("IN DELETE");
      let resp = new Promise((resolve, reject) => {
        console.log("THE DATA I GOT PRINTED RIGHT HERE IS ");
        console.log(params);
        axios_http_client(access_token)
          .delete(`/${resource}/${params.previousData.id}`)
          .then((d) => {
            resolve({ data: params.previousData });
          })
          .catch((err) => {
            reject(err);
          });
      });

      return resp;
    },
    // delete a list of records based on an array of ids
    deleteMany: (resource: any, params: any) => {
      console.log("MA DELETE KO HO");
      // about to write delete code for each id
      let ids = params.ids;
      let allDeletes = [];
      ids.map((id: string) => {
        let resp = new Promise((resolve, reject) => {
          console.log(params);
          axios_http_client(access_token)
            .delete(`/${resource}/${id}`)
            .then((d) => {
              resolve(id);
            })
            .catch((err) => {
              reject(err);
            });
        });
        allDeletes.push(resp);
      });

      return new Promise((res, rej) => {
        Promise.all(allDeletes)
          .then((d) => {
            res({ data: d });
          })
          .catch((err) => {
            rej(err);
          });
      });
    },
  };
};

export default db;
