-- Кто ввёл счёт (второй игрок должен подтвердить). Выполни в Supabase → SQL Editor.
alter table public.matches
  add column if not exists score_submitted_by uuid references public.players(id);
