-- Cross-cutting platform tables: documents, comments, notifications, activity, tasks, CMS.

create table public.documents (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users (id) on delete cascade,     -- owner
  type_id           uuid references public.document_types (id) on delete set null,
  storage_path      text not null,        -- private Supabase Storage key (not a public URL)
  original_filename text,
  mime_type         text,
  size_bytes        bigint,
  version           int not null default 1,
  uploaded_by       uuid references public.users (id) on delete set null,
  created_at        timestamptz not null default now()
);
create index documents_user_id_idx on public.documents (user_id);

-- Polymorphic comments/conversations on any entity (students, universities, high schools...).
-- Powers the CRM "conversations" pane; parent_comment_id enables threading.
create table public.comments (
  id                uuid primary key default gen_random_uuid(),
  author_user_id    uuid references public.users (id) on delete set null,
  entity_type       text not null,
  entity_id         uuid not null,
  body              text not null,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index comments_entity_idx on public.comments (entity_type, entity_id);
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  type       text,
  title      text,
  body       text,
  data       jsonb,               -- deep-link payload
  is_read    boolean not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id) where is_read = false;

create table public.push_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users (id) on delete cascade,
  expo_push_token text not null unique,
  platform        public.device_platform not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index push_tokens_user_id_idx on public.push_tokens (user_id);
create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

-- User-facing activity timeline (student history: events, uploads, status changes...).
create table public.activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users (id) on delete set null,
  entity_type text,
  entity_id   uuid,
  action      text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index activities_entity_idx on public.activities (entity_type, entity_id);

-- System audit trail (before/after snapshots); distinct from the user-facing timeline.
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users (id) on delete set null,
  entity_type text,
  entity_id   uuid,
  action      text,
  old_values  jsonb,
  new_values  jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references public.students (id) on delete cascade,
  assigned_to uuid references public.users (id) on delete set null,
  title       text not null,
  description text,
  due_date    date,
  status      public.task_status not null default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_student_id_idx on public.tasks (student_id);
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Simple CMS blocks (onboarding content, seasonal-event banners) targeted by role.
create table public.content_blocks (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  content     text,
  target_role text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger content_blocks_set_updated_at
  before update on public.content_blocks
  for each row execute function public.set_updated_at();
