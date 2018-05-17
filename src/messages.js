const { pool } = require('./pg-util');
const Promise = require('promise');
const { validate } = require('jsonschema');
const createSchema = require('../apidoc/schemas/messages.create.schema.json')

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
  WHERE p.eventId = $1`;

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
  let lastMessageTimestamp = params.lastMessageTimestamp || 0;
  let eventId = params.eventId;

  if (!eventId)
    return Promise.reject({ code: 400, message: 'eventId is missing' });

  let messages = await getNewerMessages(eventId, lastMessageTimestamp);
  let receivers = await getReceivers(eventId);

  let output = {
    receivers,
    messages
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