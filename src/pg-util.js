const { Pool } = require('pg');
const pool = new Pool();
const fs = require('fs');
const path = require('path');

let initialQuery = fs.readFileSync(path.join('src', 'init.sql'), 'utf8');

let handleError = function (err) {
  switch (err.code) {
    case "23505": // duplicate of uniq key
      return Promise.reject({
        code: 409, // Conflict
      });
    case "23503":
      return Promise.reject({
        code: 400,
      });
    default:
      return Promise.reject({
        code: 500,
        message: err.message || "db error"
      });
  }
}

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
});

// promise - checkout a client
pool.connect()
  .then(client => {
    return client.query(initialQuery)
      .then(res => {
        client.release()
      })
      .catch(err => {
        console.log(err.stack);
        process.exit(-1);
      })
  });

exports.pool = pool;
exports.handleError = handleError;