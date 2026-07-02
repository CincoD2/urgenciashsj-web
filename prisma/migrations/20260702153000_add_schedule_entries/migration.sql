CREATE TYPE "ScheduleMonth" AS ENUM ('ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC');

CREATE TABLE "ScheduleEntry" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" "ScheduleMonth" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScheduleEntry_year_month_key" ON "ScheduleEntry"("year", "month");

CREATE INDEX "ScheduleEntry_year_idx" ON "ScheduleEntry"("year");
