const { pool } = require('../pg-util');

function getNewerMessages(eventId, lastMessageId) {
  let text = `SELECT * FROM Messages
  WHERE lastMessageTimestamp > $1 and eventId = $2`;

  let query = {
    name: 'get-messages',
    text,
    values(lastMessageId, eventId)
  };

  return pool.query(query)
    .then(res => res.rows);
}

function getReceivers(eventId) {
  let text = `SELECT * FROM Participations p
  LEFT JOIN Hackers h on p.hackerId = h.id
  WHERE p.eventId = $1`;

  let query = {
    name: 'get-hackers',
    text,
    values: [eventId]
  }

  return pool.query(query)
    .then(res => res.rows.map(h => h.tgId));
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