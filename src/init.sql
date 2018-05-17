CREATE TABLE IF NOT EXISTS Messages (
	id serial PRIMARY KEY,
  eventId int,
	postTimestamp text,
	content text
);
