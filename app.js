const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const messages = require('./src/messages');
const participants = require('./src/participants');

app.use(bodyParser.json());

app.post('/api/admin/login');

app.post('/api/admin/messages', function (req, res) {
  messages.post(req.body)
    .then(() => {
      res.send();
    })
    .catch(err => {
      res.status(500).send(err);      
    });
});

app.get('/api/admin/messages', function (req, res) {
  messages.getList(req.query)
    .then(result => {
      res.send(result);
      messages.saveTimestamp(result.messages);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

app.get('/api/admin/participants/:id', function(req,res) {
  participants.getList(req.params.id)
    .then(prts => {
      res.send(prts);
    })
    .catch(err => {
      res.status(500).send(err);
    })
});

app.listen(8081, err => {
  if (!err)
    console.log('Service is listening on port 8081');
});