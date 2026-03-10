-- If username is already taken, append short suffix so signup never fails on unique violation

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_username TEXT;
  safe_display_name TEXT;
  suffix TEXT;
BEGIN
  -- Username: 3-30 chars
  safe_username := TRIM(COALESCE(NEW.raw_user_meta_data->>'username', ''));
  IF char_length(safe_username) < 3 OR char_length(safe_username) > 30 THEN
    safe_username := 'user_' || REPLACE(SUBSTR(NEW.id::text, 1, 8), '-', '');
  END IF;
  safe_username := SUBSTRING(safe_username FROM 1 FOR 30);

  -- Display name: 1-60 chars
  safe_display_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  IF char_length(safe_display_name) < 1 THEN
    safe_display_name := COALESCE(NULLIF(safe_username, ''), 'User');
  END IF;
  safe_display_name := SUBSTRING(safe_display_name FROM 1 FOR 60);

  -- Ensure username is unique: if taken, append _<first6 of id>
  suffix := REPLACE(SUBSTR(NEW.id::text, 1, 6), '-', '');
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = safe_username) THEN
    safe_username := SUBSTRING(safe_username FROM 1 FOR 23) || '_' || suffix;
  END IF;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, safe_username, safe_display_name);

  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 1000.00);

  INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, description)
  SELECT w.id, 'deposit_demo'::wallet_tx_type, 1000.00, 1000.00, 'Welcome bonus'
  FROM public.wallets w WHERE w.user_id = NEW.id;

  RETURN NEW;
END;
$$;