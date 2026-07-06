// Hand-written types mirroring supabase/migrations/*.sql.
// Regenerate with `supabase gen types typescript` once the project is
// linked to a live Supabase instance; keep this file in sync until then.
//
// These must be `type` aliases, not `interface`s: the Supabase client's
// generic constraints check each Row/Insert/Update against
// `Record<string, unknown>`, and TypeScript only grants object type
// literals (not interfaces) an implicit index signature for that check.
// An interface here silently degrades every query's inferred type to
// `never`.

export type Plan = 'free' | 'pro'
export type UserRole = 'member' | 'moderator' | 'admin'
export type SubmissionType = 'prayer' | 'praise'
export type SubmissionStatus = 'pending' | 'approved' | 'held' | 'rejected'
export type SubmissionVisibility = 'public' | 'private'
export type SubmissionPriority = 'normal' | 'urgent'
export type KeywordAction = 'hold' | 'escalate'
export type ReactionEmoji = 'prayer' | 'praise' | 'heart'
export type NotificationType = 'prayer' | 'update'

export type ChurchRow = {
  id: string
  name: string
  subdomain: string
  logo_url: string | null
  favicon_url: string | null
  brand_color: string
  background_color: string
  label_overrides: Record<string, string>
  summary_emails: string[]
  summary_enabled: boolean
  plan: Plan
  // session2.sql
  hide_member_names?: boolean | null
  // session6.sql
  crisis_line_text?: string | null
  embed_enabled?: boolean | null
  // session7.sql
  reaction_settings?: { prayer: boolean; praise: boolean; heart: boolean } | null
  created_at: string
}

export type UserRow = {
  id: string
  church_id: string
  role: UserRole
  display_name: string | null
  email: string
  // session3.sql
  profile_image_url?: string | null
  // session6.sql
  notify_prayer_email?: boolean | null
  notify_prayer_inapp?: boolean | null
  created_at: string
}

export type SubmissionRow = {
  id: string
  church_id: string
  user_id: string
  type: SubmissionType
  content: string
  is_anonymous: boolean
  status: SubmissionStatus
  flagged_reason: string | null
  moderated_by: string | null
  moderated_at: string | null
  // session6.sql — optional so pre-migration code still typechecks
  visibility?: SubmissionVisibility | null
  priority?: SubmissionPriority | null
  contact_requested?: boolean | null
  // session7.sql
  update_used?: boolean | null
  related_submission_id?: string | null
  created_at: string
}

export type KeywordRuleRow = {
  id: string
  church_id: string
  keyword: string
  action: KeywordAction
  created_at: string
}

// session2.sql
export type ReactionRow = {
  id: string
  submission_id: string
  church_id: string
  user_id?: string | null  // session7.sql — reactor identity
  emoji: ReactionEmoji
  created_at: string
}

// session2.sql
export type WaitlistRow = {
  id: string
  email: string
  created_at: string
}

export type EscalationContactRow = {
  id: string
  church_id: string
  email: string
  label: string | null
  created_at: string
}

// session6.sql
export type SubmissionUpdateRow = {
  id: string
  submission_id: string
  church_id: string
  user_id: string
  content: string
  created_at: string
}

// session6.sql
export type NotificationRow = {
  id: string
  church_id: string
  user_id: string
  submission_id: string | null
  type: NotificationType
  prayer_count: number
  read: boolean
  email_sent: boolean
  created_at: string
  updated_at: string
}

// Shape of `submissions.select('*, users!submissions_user_id_fkey(display_name)')`.
export type SubmissionWithAuthor = SubmissionRow & {
  users?: { display_name: string | null } | null
}

export type ReactionCounts = { prayer: number; praise: number; heart: number }

export type Database = {
  public: {
    Tables: {
      churches: {
        Row: ChurchRow
        Insert: Partial<ChurchRow> & Pick<ChurchRow, 'name' | 'subdomain'>
        Update: Partial<ChurchRow>
        Relationships: []
      }
      users: {
        Row: UserRow
        Insert: Partial<UserRow> & Pick<UserRow, 'id' | 'church_id' | 'email'>
        Update: Partial<UserRow>
        Relationships: []
      }
      submissions: {
        Row: SubmissionRow
        Insert: Partial<SubmissionRow> &
          Pick<SubmissionRow, 'church_id' | 'user_id' | 'type' | 'content'>
        Update: Partial<SubmissionRow>
        Relationships: []
      }
      keyword_rules: {
        Row: KeywordRuleRow
        Insert: Partial<KeywordRuleRow> &
          Pick<KeywordRuleRow, 'church_id' | 'keyword' | 'action'>
        Update: Partial<KeywordRuleRow>
        Relationships: []
      }
      escalation_contacts: {
        Row: EscalationContactRow
        Insert: Partial<EscalationContactRow> &
          Pick<EscalationContactRow, 'church_id' | 'email'>
        Update: Partial<EscalationContactRow>
        Relationships: []
      }
      reactions: {
        Row: ReactionRow
        Insert: Partial<ReactionRow> &
          Pick<ReactionRow, 'submission_id' | 'church_id' | 'emoji'>
        Update: Partial<ReactionRow>
        Relationships: []
      }
      waitlist: {
        Row: WaitlistRow
        Insert: Partial<WaitlistRow> & Pick<WaitlistRow, 'email'>
        Update: Partial<WaitlistRow>
        Relationships: []
      }
      submission_updates: {
        Row: SubmissionUpdateRow
        Insert: Partial<SubmissionUpdateRow> &
          Pick<SubmissionUpdateRow, 'submission_id' | 'church_id' | 'user_id' | 'content'>
        Update: Partial<SubmissionUpdateRow>
        Relationships: []
      }
      notifications: {
        Row: NotificationRow
        Insert: Partial<NotificationRow> &
          Pick<NotificationRow, 'church_id' | 'user_id'>
        Update: Partial<NotificationRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
