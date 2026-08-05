-- Create function to set client token in session
-- This is used to allow RLS policies to validate the token provided by the client
CREATE OR REPLACE FUNCTION public.set_client_token(token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that the token actually exists in a project before setting it
  -- This prevents setting random strings in the session variable
  IF EXISTS (SELECT 1 FROM public.projects WHERE client_token = token) THEN
    PERFORM set_config('app.client_token', token, true);
  ELSE
    -- If token is invalid, clear it
    PERFORM set_config('app.client_token', '', true);
  END IF;
END;
$$;

-- Grant execution to public (anon/authenticated)
GRANT EXECUTE ON FUNCTION public.set_client_token(text) TO anon, authenticated;
