const { pool } = require('./pg-util');
const Promise = require('promise');

function getParticipants(eventId) {
  let text = `SELECT 
  h.id, h.username, h.pic, h.contactPhone, h.email, h.tgProfileLink,
  coalesce(sum(p.xp),0) as xp, min(p.hackerStatus) as "status", bool_or(p.isSearchable),
  json_agg(s.tag) as "skills"
  FROM Participations p
  LEFT JOIN Hackers h on h.id = p.hackerId
  LEFT JOIN HackerSkills hs on hs.hackerId = h.id
  LEFT JOIN Skills s on s.id = hs.skillId
  WHERE p.eventId = $1
  GROUP BY h.id;`

  let query = {
    name: 'select-participants',
    text,
    values: [eventId]
  }

  return pool.query(query)
    .then(res => res.rows);
}

exports.getList = async (eventId, role) => {
  try {
    let rows = await getParticipants(eventId);
    let resRows = rows.map(r => ({
      id: r.id,
      username: r.username,
      pic: r.pic,
      contactPhone: role === 'org' ? r.contactphone : null,
      email: role === 'org' ? r.email : null,
      status: r.status,
      skills: r.skills,
      tgProfileLink: r.tgprofilelink,
      isSearchable: r.bool_or,
      xp: r.xp / (r.skills.length || 1)
    }));

    return Promise.resolve(resRows);
  } catch (err) {
    return Promise.reject({ code: err.code, message: err.message })
  }
}