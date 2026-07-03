ALTER TABLE "ScheduleEntry"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

DROP INDEX "ScheduleEntry_year_month_key";

CREATE UNIQUE INDEX "ScheduleEntry_year_month_version_key"
ON "ScheduleEntry"("year", "month", "version");

CREATE INDEX "ScheduleEntry_year_month_idx"
ON "ScheduleEntry"("year", "month");
