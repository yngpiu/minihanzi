-- Rename meanings to kind_groups
alter table public.vocabulary_entries
  rename column "meanings" to "kind_groups";

-- Migrate old flat meanings ({ meaning, example }) into new kind_groups format
-- [{ kind, means: [{ meaning, examples: [...] }] }]
update public.vocabulary_entries
set kind_groups = (
  select jsonb_agg(elem)
  from (
    select jsonb_build_object(
      'kind', '',
      'means', jsonb_agg(
        jsonb_build_object(
          'meaning', m->>'meaning',
          'examples', case
            when m->'example'->>'hanzi' = '' and m->'example'->>'pinyin' = '' and m->'example'->>'meaning' = ''
              then '[]'::jsonb
            else jsonb_build_array(m->'example')
          end
        )
      )
    ) as elem
    from jsonb_array_elements(kind_groups) m
  ) sub
)
where jsonb_array_length(kind_groups) > 0
  and kind_groups#>>'{0,kind}' is null;
