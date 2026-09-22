-- Refuse rollback when multiple trips exist: the singleton check fails instead
-- of silently deleting their data. Back up/export those trips before rollback.
ALTER TABLE trip
  MODIFY COLUMN id BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT ck_trip_singleton CHECK (id = 1);

ALTER TABLE days
  DROP FOREIGN KEY fk_days_trip,
  DROP INDEX uq_days_trip_date,
  DROP COLUMN trip_id,
  ADD UNIQUE KEY uq_days_date (date);

ALTER TABLE trip
  DROP CHECK ck_trip_theme,
  DROP INDEX uq_trip_slug,
  DROP COLUMN slug,
  DROP COLUMN theme,
  MODIFY COLUMN id TINYINT UNSIGNED NOT NULL DEFAULT 1;
