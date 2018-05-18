const { pool } = require('./pg-util');
const Promise = require('promise');
const { validate } = require('jsonschema');
const createSchema = require('../apidoc/schemas/messages.create.schema.json')
const _ = require('underscore');
const fs = require('fs');
const TIMESTAMP_PATH = 'last_message_timestamp.txt';

function readTimestamp() {
  try {
    let ts = fs.readFileSync(TIMESTAMP_PATH, 'utf8');
    if (typeof parseInt(ts) != ts)
      throw '';
    return ts;
  } catch (err) {
    return 1;
  }
}

let lastRequestedTimestapm = readTimestamp();

function getNewerMessages(eventId, lastMessageId) {
  let text = `SELECT * FROM Messages
  WHERE postTimestamp > $1 and eventId = $2`;

  let query = {
    name: 'get-messages',
    text,
    values: [lastMessageId, eventId]
  };

  return pool.query(query)
    .then(res => res.rows);
}

function getReceivers(eventId) {
  let text = `SELECT tgId FROM Participations p
  LEFT JOIN Hackers h on p.hackerId = h.id
  WHERE p.eventId = $1 and p.hackerStatus != 'participated' `;

  let query = {
    name: 'get-hackers',
    text,
    values: [eventId]
  }

  return pool.query(query)
    .then(res => res.rows.filter(h => h.tgid).map(h => h.tgid));
}

function postMessage(eventId, content) {
  let text = `INSERT INTO Messages (eventId, content, postTimestamp)
  VALUES ($1, $2, '${Math.trunc(Date.now() / 1000)}')`

  let query = {
    name: 'insert-message',
    text,
    values: [eventId, content]
  }

  return pool.query(query);
}

exports.getList = async (params) => {
  let lastMessageTimestamp = params.lastMessageTimestamp || lastRequestedTimestapm;
  let eventId = params.eventId;

  if (!eventId)
    return Promise.reject({ code: 400, message: 'eventId is missing' });

  let messages = await getNewerMessages(eventId, lastMessageTimestamp);
  let receivers = await getReceivers(eventId);

  let output = {
    receivers,
    messages: messages.map(m => ({
      id: m.id,
      eventId: m.eventid,
      postTimestamp: m.posttimestamp,
      content: m.content
    }))
  }

  return Promise.resolve(output);
}

exports.post = async (obj) => {
  try {
    let validationResult = validate(obj, createSchema);
    if (!validationResult.valid)
      return Promise.reject({ code: 400, message: validationResult.errors })

    let eventId = obj.eventId;
    let message = obj.message;

    await postMessage(eventId, message);

    return Promise.resolve();
  } catch (err) {
    return Promise.reject({ code: err.code, message: err.message })
  }
}

exports.saveTimestamp = (msgs) => {
  let newStamp = _.max(msgs, m => m.postTimestamp).postTimestamp;
  if (!newStamp)
    return;
    
  lastRequestedTimestapm = newStamp;
  fs.writeFile(TIMESTAMP_PATH, lastRequestedTimestapm, 'utf8', (err) => {
    if (err)
      console.error('error while saving timestamp: ', err);
  })
}
