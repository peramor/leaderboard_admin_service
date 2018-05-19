const crypto = require('crypto');
const jwt = require('jsonwebtoken');

let unit = {};

const SECRET = process.env.SECRET;

if (!SECRET) {
  console.error('Environment variable SECRET is required.');
  process.exit(-1);
}

/**
 * Generates jwt token.
 */
unit.makeToken = (data) => {
  return jwt.sign(data, SECRET, { expiresIn: '60d' });
}

let decodeToken = (token) => {
  return jwt.verify(token, SECRET);
}

/**
 * Generates salt and pwdHash from it.
 * @param {string} pwd user's password
 * @param {string?} mySalt if not set, will be generated
 * @returns {object} containing generated `salt` and `pwdHash`
 */
unit.generatePasswordHash = (pwd, mySalt = '') => {
  let salt = mySalt || crypto.randomBytes(128)
    .toString('hex')
    .slice(0, 256);

  let pwdHash = crypto.createHmac('sha256', salt)
    .update(pwd)
    .digest('hex');

  return { salt, pwdHash };
}

/**
 * This module represents a middleware for checking
 * user's authentication.
 */
function authenticate(req, res, next) {
  try {
    let token = req.headers['authorization'];
    if (token === process.env.TG_BOT_TOKEN) {
      req._acl = { role: 'bot' };
      return next();
    }

    let data = decodeToken(token);

    req._acl = data;

    next();
  } catch (err) {
    res.status(401).send();
  }
}

unit.middleware = () => {
  return authenticate;
}

module.exports = unit;