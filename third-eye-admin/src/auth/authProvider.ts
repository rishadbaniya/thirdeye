import { addRefreshAuthToAuthProvider, AuthProvider } from "react-admin";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const authProvider: AuthProvider = {
  login: ({ email, password }) => {
    return new Promise((res, rej) => {
      axios
        .request({
          method: "post",
          url: "http://localhost:8000/login",
          data: {
            email,
            password,
          },
        })
        .then(({ data }) => {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          res("Success");
        })
        .catch((err) => {
          let status = err.response.status;
          if (status === 401) {
            rej("Failed! Invalid Credentials!");
          } else {
            rej(`Failed! Unknwon Error(${status})`);
          }
        });
    });
  },

  // called when the API returns an error
  checkError: ({ status }: { status: number }) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem("access_token");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  // called when the user clicks on the logout button
  logout: () => {
    let refresh_token = localStorage.getItem("refresh_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    axios
      .request({
        method: "post",
        url: "http://localhost:8000/logout",
        data: {
          refresh_token,
        },
      })
      .then(({ data }) => {
        console.log(data);
      })
      .catch((err) => {
        console.error(err);
      });
    return Promise.resolve();
  },

  // called when the user navigates to a new location, to check for
  // authentication
  checkAuth: () => {
    return localStorage.getItem("access_token")
      ? Promise.resolve()
      : Promise.reject();
  },

  getPermissions: () => Promise.resolve(),
};

const getAuthTokensFromLocalStorage = () => {
  let access_token = localStorage.getItem("access_token");
  let refresh_token = localStorage.getItem("refresh_token");
  return [access_token, refresh_token];
};

//type NewTokens ={
//new_access_token : String,
//new_refresh_token : String
//}
const refreshAuthTokens = (refresh_token: string): Promise<void> => {
  return new Promise((res, rej) => {
    axios
      .request({
        method: "post",
        url: "http://localhost:8000/refresh",
        data: {
          refresh_token,
        },
      })
      .then(({ data }) => {
        localStorage.setItem("access_token", data.new_access_token);
        localStorage.setItem("refresh_token", data.new_refresh_token);
        res();
      })
      .catch((err) => {
        let status = err.response.status;
        if (status === 401) {
          rej("Failed! Invalid Credentials!");
        } else {
          rej(`Failed! Unknwon Error(${status})`);
        }
      });
  });
};

const refreshAuth = () => {
  const [access_token, refresh_token] = getAuthTokensFromLocalStorage();

  if (access_token && refresh_token) {
    try {
      const decoded_access_token = jwtDecode(access_token);
      console.log(decoded_access_token.exp!, Date.now() / 1000);
      console.log(decoded_access_token);
      if (decoded_access_token.exp! < Date.now() / 1000) {
        console.log("ACCESSING A NEW ACCESS TOKEN");
        return refreshAuthTokens(refresh_token);
      }
    } catch (e) {
      return Promise.resolve();
    }
  }
  return Promise.resolve();
};

const refreshAuthProvider = addRefreshAuthToAuthProvider(
  authProvider,
  refreshAuth
);

export { refreshAuthProvider, refreshAuth };
