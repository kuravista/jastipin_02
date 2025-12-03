-- Create function to auto-create user when auth user is created (Supabase OAuth)
CREATE OR REPLACE FUNCTION public.create_user_on_auth_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user doesn't already exist in public.User table
  IF NOT EXISTS (SELECT 1 FROM public."User" WHERE id = NEW.id) THEN
    -- Insert new user with auth.user id and email
    INSERT INTO public."User" (id, email, slug, "createdAt", "updatedAt")
    VALUES (
      NEW.id,
      NEW.email,
      -- Generate slug from email (take part before @)
      LOWER(SPLIT_PART(NEW.email, '@', 1)) || '-' || SUBSTRING(NEW.id, 1, 8),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_on_auth_signup();
