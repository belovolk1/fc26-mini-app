-- Регистрация на турнир разрешена только за 15 минут до старта турнира.
-- Выполни в Supabase → SQL Editor после supabase-tournaments.sql.

CREATE OR REPLACE FUNCTION public.tournament_registration_check_15min()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_t record;
BEGIN
  SELECT status, registration_end, tournament_start
  INTO v_t
  FROM tournaments
  WHERE id = NEW.tournament_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;
  IF v_t.status != 'registration' THEN
    RAISE EXCEPTION 'Registration is not open for this tournament';
  END IF;
  IF now() < v_t.tournament_start - interval '15 minutes' THEN
    RAISE EXCEPTION 'Registration opens 15 minutes before tournament start';
  END IF;
  IF now() >= v_t.registration_end THEN
    RAISE EXCEPTION 'Registration has ended';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tournament_registration_15min_trigger ON public.tournament_registrations;
CREATE TRIGGER tournament_registration_15min_trigger
  BEFORE INSERT ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.tournament_registration_check_15min();
