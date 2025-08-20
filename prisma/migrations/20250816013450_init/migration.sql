-- CreateEnum
CREATE TYPE "public"."Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "public"."watchlists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "aiSummary" TEXT,
    "aiSeverity" "public"."Severity",
    "aiAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "watchlists_name_key" ON "public"."watchlists"("name");

-- CreateIndex
CREATE INDEX "events_watchlistId_idx" ON "public"."events"("watchlistId");

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "public"."watchlists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
