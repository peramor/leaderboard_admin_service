CREATE TABLE IF NOT EXISTS Messages (
	id serial PRIMARY KEY,
  eventId number,
	postTimestamp text,
	content text
);
