const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const messages = require('./src/messages');
const participants = require('./src/participants');
const login = require('./src/login');
const authN = require('./src/authN');
const path = require('path');

app.use(bodyParser.json());

app.get('/api/admin', function(req,res) {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.post('/api/admin/login', function (req, res) {
  login.login(req.body.login, req.body.pwd)
    .then(result => {
      res.send(result);
    })
    .catch(err => {
      if (err.code === 401)
        return res.status(401).send();
      res.status(500).send(err);
      console.error(err);      
    });
});

app.post('/api/admin/messages', authN.middleware(), function (req, res) {
  if (req._acl.role !== 'org')
    return res.status(403).send();
  messages.post(req.body)
    .then(() => {
      res.send();
    })
    .catch(err => {
      console.error(err);      
      res.status(500).send(err);
    });
});

app.get('/api/admin/messages', authN.middleware(), function (req, res) {
  messages.getList(req.query)
    .then(result => {
      res.send(result);
      messages.saveTimestamp(result.messages);
    })
    .catch(err => {
      console.error(err);      
      res.status(500).send(err);
    });
});

app.get('/api/admin/participants/:id', authN.middleware(), function (req, res) {
  participants.getList(req.params.id, req._acl.role)
    .then(prts => {
      res.send(prts);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send(err);
    })
});

app.listen(8081, err => {
  if (!err)
    console.log('Service is listening on port 8081');
});