import {AuthProvider} from 'react-admin';

export const authProvider: AuthProvider = {
  // called when the user attempts to log in
  login: ({email, password}) => {
    const request = new Request('http://localhost:8000/login', {
      method: 'POST',
      body: JSON.stringify({email, password}),
      headers: new Headers({'Content-Type': 'application/json'}),
    });
    return fetch(request)
        .then((response) => {
          if (response.status < 200 || response.status >= 300) {
            throw new Error(response.statusText);
          }
          return response.json();
        })
        .then(({access_token, refresh_token}) => {
          console.log('success');
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
        });
  },

  // called when the user clicks on the logout button
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return Promise.resolve();
  },
  // called when the API returns an error
  checkError: ({status}: {status: number}) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem('access_token');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  // called when the user navigates to a new location, to check for
  // authentication
  checkAuth: () => {
    return localStorage.getItem('access_token') ? Promise.resolve() :
                                                  Promise.reject();
  },
  getPermissions: () => Promise.resolve(),
};
