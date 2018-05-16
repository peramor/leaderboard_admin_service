const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const messages = require('./src/messages');

app.use(bodyParser.json());

app.post('/api/admin/messages');

app.get('/api/admin/messages', function (req, res) {
  messages.getList(req.query)
    .then(result => {
      res.send(result);
    })
    .catch(err => {
      res.status(500).send("bled navalny");
    });
});

app.post('/api/admin/login');

app.get('/api/admin/participants');


app.listen(8081, err => {
  if (!err)
    console.log('Service is listening on port 8081')
});