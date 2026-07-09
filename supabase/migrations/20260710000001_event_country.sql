-- Events gain a structured country (alongside the existing state_province_id) so the
-- admin form can capture geography as a cascading Country -> State/Province pair, the
-- same way job-application forms do. `country_id` lets an event be recorded at
-- country granularity even when we hold no subdivisions for that country. The
-- redundant free-text `location` column is retained but no longer populated by the
-- form (kept to preserve any historical values; can be repurposed as a venue later).
alter table public.events
  add column country_id uuid references public.countries (id) on delete set null;

-- Guard: a state/province must belong to the chosen country, so the pair can never
-- drift out of sync (e.g. country=Mexico, state=California).
create or replace function public.event_state_matches_country()
returns trigger
language plpgsql
as $$
begin
  if new.state_province_id is not null then
    if new.country_id is null then
      raise exception 'country_id is required when state_province_id is set'
        using errcode = 'check_violation';
    end if;
    if not exists (
      select 1 from public.states_provinces sp
      where sp.id = new.state_province_id and sp.country_id = new.country_id
    ) then
      raise exception 'state_province_id % does not belong to country_id %',
        new.state_province_id, new.country_id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger events_state_matches_country
  before insert or update on public.events
  for each row execute function public.event_state_matches_country();
