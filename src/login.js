const auth = require('./authN');

let LOGIN = process.env.BUILD_IN_LOGIN;
let PWD = process.env.BUILD_IN_PWD;

exports.login = (login, pwd) => {
  if (login !== LOGIN && pwd !== PWD) {
    return Promise.reject({code: 401});
  }

  let token = auth.makeToken({id: 1, role: 'org' });
  return Promise.resolve({token});
}