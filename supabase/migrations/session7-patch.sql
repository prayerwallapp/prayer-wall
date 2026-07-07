-- session7-patch.sql — Reaction emoji constraint fix
-- Run in Supabase SQL Editor AFTER session7.sql has been applied.
-- session7.sql renamed emoji keys from (pray, heart, strength) → (prayer, praise, heart)
-- but did not update the CHECK constraint on reactions.emoji. This patch fixes that.

ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_emoji_check;
ALTER TABLE reactions ADD CONSTRAINT reactions_emoji_check
  CHECK (emoji IN ('prayer', 'praise', 'heart'));
