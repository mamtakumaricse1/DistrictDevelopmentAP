-- Official Changlang list uses sub-divisions above blocks and circles.
ALTER TYPE "LocationType" ADD VALUE 'SUB_DIVISION';

-- Circle rows from the district workbook carry a village count, not a population.
ALTER TABLE "locations" ADD COLUMN "village_count" INTEGER;
