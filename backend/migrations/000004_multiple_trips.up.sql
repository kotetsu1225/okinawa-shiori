-- Keep all existing records attached to Okinawa (the original trip has id=1).
ALTER TABLE trip
  DROP CHECK ck_trip_singleton,
  MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ADD COLUMN slug VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD COLUMN theme VARCHAR(16) NOT NULL DEFAULT 'okinawa';

UPDATE trip SET slug = 'okinawa' WHERE id = 1;

ALTER TABLE trip
  MODIFY COLUMN slug VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  ADD UNIQUE KEY uq_trip_slug (slug),
  ADD CONSTRAINT ck_trip_theme CHECK (theme IN ('okinawa', 'onsen'));

ALTER TABLE days
  ADD COLUMN trip_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
  DROP INDEX uq_days_date,
  ADD UNIQUE KEY uq_days_trip_date (trip_id, date),
  ADD CONSTRAINT fk_days_trip FOREIGN KEY (trip_id)
    REFERENCES trip (id) ON DELETE RESTRICT ON UPDATE RESTRICT;
