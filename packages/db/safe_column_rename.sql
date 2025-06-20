-- Safe column rename script
-- This preserves all existing data in the searchEmbedding column

-- Step 1: Rename searchEmbedding to viralInfoEmbedding
ALTER TABLE "SampleVideo" 
RENAME COLUMN "searchEmbedding" TO "viralInfoEmbedding";

-- Step 2: Add new optional columns that will be added by schema
-- These will be added automatically by db:push, but listing here for reference:
-- ALTER TABLE "SampleVideo" ADD COLUMN "colorPalette" TEXT;
-- ALTER TABLE "SampleVideo" ADD COLUMN "colorPaletteEmbedding" vector(768);

-- Step 3: Remove thumbnail column if it exists (you mentioned it was empty)
-- ALTER TABLE "SampleVideo" DROP COLUMN IF EXISTS "thumbnail";

-- Note: DemoVideo table will be created automatically by db:push 