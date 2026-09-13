-- ============ Owner protection & role helpers ============
CREATE OR REPLACE FUNCTION public.owner_email()
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT 'muhammadzain7000@gmail.com'::text $$;

CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id AND lower(u.email) = public.owner_email()
  )
$$;
REVOKE ALL ON FUNCTION public.is_owner(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO service_role;

-- staff = owner or admin (used by policies)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = _user_id
      AND r.role IN ('owner','admin','editor')
      AND (auth.uid() IS NULL OR _user_id = auth.uid())
  )
$$;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- Nobody may remove or change the permanent owner's owner role.
CREATE OR REPLACE FUNCTION public.protect_owner_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE target uuid;
BEGIN
  target := COALESCE(OLD.user_id, NEW.user_id);
  IF public.is_owner(target) AND COALESCE(OLD.role, NEW.role) = 'owner' THEN
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.role <> 'owner') THEN
      RAISE EXCEPTION 'The permanent owner role cannot be removed or changed.';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS user_roles_protect_owner ON public.user_roles;
CREATE TRIGGER user_roles_protect_owner
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_owner_role();

-- ============ Admin audit log ============
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text NOT NULL DEFAULT '',
  action text NOT NULL,
  target_type text NOT NULL DEFAULT '',
  target_id text NOT NULL DEFAULT '',
  target_label text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_log_staff_read ON public.admin_audit_log;
CREATE POLICY audit_log_staff_read ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);

-- ============ Support ============
CREATE TABLE IF NOT EXISTS public.support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  guest_name text NOT NULL DEFAULT '',
  guest_email text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT 'Support request',
  status text NOT NULL DEFAULT 'ai',
  escalated boolean NOT NULL DEFAULT false,
  plan_key text,
  source text NOT NULL DEFAULT 'dashboard',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_threads TO authenticated;
GRANT ALL ON public.support_threads TO service_role;
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_threads_own ON public.support_threads;
CREATE POLICY support_threads_own ON public.support_threads FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
DROP POLICY IF EXISTS support_threads_insert_own ON public.support_threads;
CREATE POLICY support_threads_insert_own ON public.support_threads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS support_threads_update_own ON public.support_threads;
CREATE POLICY support_threads_update_own ON public.support_threads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
CREATE INDEX IF NOT EXISTS support_threads_user_idx ON public.support_threads (user_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender text NOT NULL,
  author_id uuid,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_messages_read ON public.support_messages;
CREATE POLICY support_messages_read ON public.support_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );
DROP POLICY IF EXISTS support_messages_insert ON public.support_messages;
CREATE POLICY support_messages_insert ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );
CREATE INDEX IF NOT EXISTS support_messages_thread_idx ON public.support_messages (thread_id, created_at);

-- ============ AI usage (server-side rate limiting) ============
CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_usage_events TO authenticated;
GRANT ALL ON public.ai_usage_events TO service_role;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_usage_select_own ON public.ai_usage_events;
CREATE POLICY ai_usage_select_own ON public.ai_usage_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
CREATE INDEX IF NOT EXISTS ai_usage_user_time_idx ON public.ai_usage_events (user_id, created_at DESC);

-- ============ Notifications ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_own ON public.notifications;
CREATE POLICY notifications_own ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);

-- ============ Team members (subscription seats) ============
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  member_email text NOT NULL,
  member_user_id uuid,
  member_role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, member_email)
);
GRANT SELECT, INSERT, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_members_own ON public.team_members;
CREATE POLICY team_members_own ON public.team_members FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id OR auth.uid() = member_user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
DROP POLICY IF EXISTS team_members_delete_own ON public.team_members;
CREATE POLICY team_members_delete_own ON public.team_members FOR DELETE TO authenticated USING (auth.uid() = owner_user_id);
CREATE INDEX IF NOT EXISTS team_members_owner_idx ON public.team_members (owner_user_id);

-- ============ Verified book registry (no content seeded) ============
CREATE TABLE IF NOT EXISTS public.textbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board text NOT NULL DEFAULT 'Punjab',
  class_level text NOT NULL,
  subject text NOT NULL,
  medium text NOT NULL DEFAULT 'English',
  academic_session text NOT NULL,
  publication_year integer,
  publisher text NOT NULL DEFAULT '',
  edition text NOT NULL DEFAULT '',
  title text NOT NULL,
  source_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'PENDING_VERIFICATION',
  verified_by uuid,
  verified_at timestamptz,
  page_count integer,
  processing_status text NOT NULL DEFAULT 'not_uploaded',
  processing_error text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.textbooks TO authenticated;
GRANT ALL ON public.textbooks TO service_role;
ALTER TABLE public.textbooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS textbooks_read_active ON public.textbooks;
CREATE POLICY textbooks_read_active ON public.textbooks FOR SELECT TO authenticated
  USING (status = 'ACTIVE' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
CREATE INDEX IF NOT EXISTS textbooks_lookup_idx ON public.textbooks (board, class_level, subject, status);

CREATE TABLE IF NOT EXISTS public.textbook_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id uuid NOT NULL REFERENCES public.textbooks(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  chapter_name text NOT NULL,
  page_from integer,
  page_to integer,
  content_indexed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.textbook_chapters TO authenticated;
GRANT ALL ON public.textbook_chapters TO service_role;
ALTER TABLE public.textbook_chapters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS textbook_chapters_read ON public.textbook_chapters;
CREATE POLICY textbook_chapters_read ON public.textbook_chapters FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.textbooks b WHERE b.id = textbook_id AND b.status = 'ACTIVE')
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')
  );
CREATE INDEX IF NOT EXISTS textbook_chapters_book_idx ON public.textbook_chapters (textbook_id, chapter_number);

-- ============ Question fingerprints (duplicate prevention) ============
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS fingerprint text;
CREATE INDEX IF NOT EXISTS questions_fingerprint_idx ON public.questions (user_id, fingerprint);

-- ============ Paper customization (watermark/footer/style) ============
ALTER TABLE public.papers ADD COLUMN IF NOT EXISTS watermark_text text;
ALTER TABLE public.papers ADD COLUMN IF NOT EXISTS footer_note text;
ALTER TABLE public.papers ADD COLUMN IF NOT EXISTS pdf_style text NOT NULL DEFAULT 'classic';

-- ============ Missing indexes ============
CREATE INDEX IF NOT EXISTS user_roles_user_idx ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS paper_questions_paper_idx ON public.paper_questions (paper_id);
CREATE INDEX IF NOT EXISTS paper_questions_question_idx ON public.paper_questions (question_id);

-- ============ updated_at triggers ============
DROP TRIGGER IF EXISTS support_threads_set_updated_at ON public.support_threads;
CREATE TRIGGER support_threads_set_updated_at BEFORE UPDATE ON public.support_threads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS team_members_set_updated_at ON public.team_members;
CREATE TRIGGER team_members_set_updated_at BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS textbooks_set_updated_at ON public.textbooks;
CREATE TRIGGER textbooks_set_updated_at BEFORE UPDATE ON public.textbooks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();