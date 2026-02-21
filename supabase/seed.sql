-- Canonical well seed data for Slopcast v1.
-- Uses deterministic pseudo-random values via setseed.

do $$
declare
  i integer;
  center_lat double precision := 31.9;
  center_lng double precision := -102.3;
  operators text[] := array['Strata Ops LLC', 'Blue Mesa Energy', 'Atlas Peak Resources'];
  formations text[] := array['Wolfcamp A', 'Wolfcamp B', 'Bone Spring'];
  statuses text[] := array['PRODUCING', 'DUC', 'PERMIT'];
begin
  perform setseed(0.271828);

  for i in 0..39 loop
    insert into public.wells (
      external_key,
      name,
      lat,
      lng,
      lateral_length,
      status,
      operator,
      formation
    )
    values (
      format('w-%s', i),
      format('Maverick %sH', i + 1),
      center_lat + (random() - 0.5) * 0.15,
      center_lng + (random() - 0.5) * 0.2,
      case when random() > 0.5 then 10000 else 7500 end,
      statuses[(i % array_length(statuses, 1)) + 1],
      operators[(i % array_length(operators, 1)) + 1],
      formations[(i % array_length(formations, 1)) + 1]
    )
    on conflict (external_key) do update
      set name = excluded.name,
          lat = excluded.lat,
          lng = excluded.lng,
          lateral_length = excluded.lateral_length,
          status = excluded.status,
          operator = excluded.operator,
          formation = excluded.formation,
          updated_at = now();
  end loop;
end;
$$;
