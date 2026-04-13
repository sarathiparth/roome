-- ============================================================
-- 001: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 002: Auto-create match on mutual like
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_mutual_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_a uuid;
  v_user_b uuid;
BEGIN
  -- Only process 'like' or 'super' swipes
  IF NEW.direction NOT IN ('like', 'super') THEN
    RETURN NEW;
  END IF;

  -- Check if the other person already liked back
  IF EXISTS (
    SELECT 1 FROM public.swipes
    WHERE swiper_id = NEW.swiped_id
      AND swiped_id = NEW.swiper_id
      AND direction IN ('like', 'super')
  ) THEN
    -- Ensure consistent ordering to satisfy the unique constraint
    v_user_a := LEAST(NEW.swiper_id, NEW.swiped_id);
    v_user_b := GREATEST(NEW.swiper_id, NEW.swiped_id);

    INSERT INTO public.matches (user_a, user_b, created_at)
    VALUES (v_user_a, v_user_b, NOW())
    ON CONFLICT (user_a, user_b) DO NOTHING;

    -- Notify both users
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES
      (NEW.swiper_id, 'match', jsonb_build_object('matched_with', NEW.swiped_id)),
      (NEW.swiped_id, 'match', jsonb_build_object('matched_with', NEW.swiper_id));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_swipe_created ON public.swipes;
CREATE TRIGGER on_swipe_created
  AFTER INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.handle_mutual_like();

-- ============================================================
-- 003: Row Level Security
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true); -- anyone authenticated can browse profiles
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "listings_select" ON public.listings;
DROP POLICY IF EXISTS "listings_insert_own" ON public.listings;
DROP POLICY IF EXISTS "listings_update_own" ON public.listings;
DROP POLICY IF EXISTS "listings_delete_own" ON public.listings;
CREATE POLICY "listings_select" ON public.listings FOR SELECT USING (true);
CREATE POLICY "listings_insert_own" ON public.listings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "listings_update_own" ON public.listings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "listings_delete_own" ON public.listings FOR DELETE USING (auth.uid() = owner_id);

-- co_roommates
ALTER TABLE public.co_roommates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "co_roommates_select" ON public.co_roommates;
CREATE POLICY "co_roommates_select" ON public.co_roommates FOR SELECT USING (true);

-- swipes
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "swipes_own" ON public.swipes;
CREATE POLICY "swipes_own" ON public.swipes
  USING (auth.uid() = swiper_id)
  WITH CHECK (auth.uid() = swiper_id);

-- matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "matches_select" ON public.matches;
CREATE POLICY "matches_select" ON public.matches
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = match_id
        AND (user_a = auth.uid() OR user_b = auth.uid())
    )
  );
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE id = match_id
        AND (user_a = auth.uid() OR user_b = auth.uid())
    )
  );

-- vibe_responses
ALTER TABLE public.vibe_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vibe_own" ON public.vibe_responses;
CREATE POLICY "vibe_own" ON public.vibe_responses
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 004: Realtime for messages + matches
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
