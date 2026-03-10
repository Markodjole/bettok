-- Fix signup trigger: ensure username and display_name always satisfy table constraints
-- (username 3-30 chars, display_name 1-60 chars) to avoid "Database error saving new user"

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  safe_username TEXT;
  safe_display_name TEXT;
BEGIN
  -- Username: must be 3-30 chars, unique. Fallback to user_<first8chars of uuid>
  safe_username := TRIM(COALESCE(NEW.raw_user_meta_data->>'username', ''));
  IF char_length(safe_username) < 3 OR char_length(safe_username) > 30 THEN
    safe_username := 'user_' || REPLACE(SUBSTR(NEW.id::text, 1, 8), '-', '');
  END IF;
  safe_username := SUBSTRING(safe_username FROM 1 FOR 30);

  -- Display name: must be 1-60 chars
  safe_display_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  IF char_length(safe_display_name) < 1 THEN
    safe_display_name := COALESCE(NULLIF(safe_username, ''), 'User');
  END IF;
  safe_display_name := SUBSTRING(safe_display_name FROM 1 FOR 60);

  INSERT INTO profiles (id, username, display_name)
  VALUES (NEW.id, safe_username, safe_display_name);

  INSERT INTO wallets (user_id, balance)
  VALUES (NEW.id, 1000.00);

  INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, description)
  SELECT w.id, 'deposit_demo', 1000.00, 1000.00, 'Welcome bonus'
  FROM wallets w WHERE w.user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;