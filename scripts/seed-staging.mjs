// seed-staging.mjs — applies synthetic seed data to the staging Supabase project
// Run: node scripts/seed-staging.mjs
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.staging
//
// Safe to re-run: uses upsert and skips existing records.
// NEVER run against production — checks project ref before any writes.

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.staging')

// ── Load .env.staging ────────────────────────────────────────────────────────
let envContents
try {
  envContents = readFileSync(envPath, 'utf-8')
} catch {
  console.error('ERROR: .env.staging not found. Create it before running this script.')
  process.exit(1)
}

const env = Object.fromEntries(
  envContents
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => l.split('=').map((p, i) => (i === 0 ? p.trim() : l.slice(l.indexOf('=') + 1).trim())))
)

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.staging')
  process.exit(1)
}

// ── Guard: refuse to run against prod ────────────────────────────────────────
const STAGING_REF = 'klrxuehjjckbllszedkl'
const PROD_REF = 'vugttmpvqvqvkktlebmf'

if (!supabaseUrl.includes(STAGING_REF)) {
  console.error(`ERROR: NEXT_PUBLIC_SUPABASE_URL does not contain staging ref (${STAGING_REF}).`)
  console.error('       Refusing to seed — this script must only run against staging.')
  process.exit(1)
}
if (supabaseUrl.includes(PROD_REF)) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL matches the PRODUCTION project ref. Aborting.')
  process.exit(1)
}

console.log(`Seeding staging project: ${STAGING_REF}`)

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── 1. Churches ───────────────────────────────────────────────────────────────
console.log('\n[1/6] Upserting churches...')

const { error: churchError } = await supabase.from('churches').upsert([
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Grace Chapel (Staging)',
    subdomain: 'grace-staging',
    brand_color: '#6366F1',
    background_color: '#FAFAF9',
    hide_member_names: false,
    reaction_settings: { prayer: true, praise: true, heart: true },
    embed_enabled: false,
    summary_emails: ['staging-grace-admin@prayerwallapp.com'],
    summary_enabled: true,
    plan: 'free',
    wall_density: 'large',
    label_overrides: {},
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    name: 'Hillside Community (Staging)',
    subdomain: 'hillside-staging',
    brand_color: '#059669',
    background_color: '#F0FDF4',
    hide_member_names: false,
    reaction_settings: { prayer: true, praise: true, heart: true },
    embed_enabled: true, // required for insert_embed_reaction tests
    summary_emails: ['staging-hillside-admin@prayerwallapp.com'],
    summary_enabled: true,
    plan: 'free',
    wall_density: 'small',
    crisis_line_text: 'If you or someone you know is in crisis, call 988.',
    label_overrides: { wall_title: 'Hillside Prayer Wall', submit_button: 'Share with us' },
  },
], { onConflict: 'id' })

if (churchError) { console.error('Church upsert failed:', churchError.message); process.exit(1) }
console.log('  ✓ 2 churches')

// ── 2. Auth users (admin API) ─────────────────────────────────────────────────
console.log('\n[2/6] Creating auth users...')

const testUsers = [
  { email: 'staging-grace-admin@prayerwallapp.com',   churchId: 'c0000000-0000-0000-0000-000000000001', role: 'admin',  displayName: 'Grace Admin (Staging)' },
  { email: 'staging-hillside-admin@prayerwallapp.com', churchId: 'c0000000-0000-0000-0000-000000000002', role: 'admin',  displayName: 'Hillside Admin (Staging)' },
  { email: 'staging-hillside-member@prayerwallapp.com',churchId: 'c0000000-0000-0000-0000-000000000002', role: 'member', displayName: 'Hillside Member (Staging)' },
]

const createdUsers = []

for (const u of testUsers) {
  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers()
  const already = existing?.users?.find(au => au.email === u.email)

  if (already) {
    console.log(`  ↩  ${u.email} (already exists, id: ${already.id})`)
    createdUsers.push({ ...u, authId: already.id })
    continue
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: 'StagingTest2026!',
    email_confirm: true,
    user_metadata: { display_name: u.displayName },
  })

  if (error) { console.error(`  ✗ Failed to create ${u.email}:`, error.message); process.exit(1) }
  console.log(`  ✓ ${u.email} (id: ${data.user.id})`)
  createdUsers.push({ ...u, authId: data.user.id })
}

// ── 3. Public users ───────────────────────────────────────────────────────────
console.log('\n[3/6] Upserting public.users...')

const { error: userError } = await supabase.from('users').upsert(
  createdUsers.map(u => ({
    id: u.authId,
    church_id: u.churchId,
    role: u.role,
    display_name: u.displayName,
    email: u.email,
  })),
  { onConflict: 'id' }
)

if (userError) { console.error('User upsert failed:', userError.message); process.exit(1) }
console.log(`  ✓ ${createdUsers.length} users`)

const graceAdmin   = createdUsers.find(u => u.email === 'staging-grace-admin@prayerwallapp.com')
const hillsideAdmin = createdUsers.find(u => u.email === 'staging-hillside-admin@prayerwallapp.com')
const hillsideMember = createdUsers.find(u => u.email === 'staging-hillside-member@prayerwallapp.com')

// ── 4. Keyword rules + escalation contacts ────────────────────────────────────
console.log('\n[4/6] Upserting keyword rules and escalation contacts...')

const { error: kwError } = await supabase.from('keyword_rules').upsert([
  { church_id: 'c0000000-0000-0000-0000-000000000001', keyword: 'harm',   action: 'escalate' },
  { church_id: 'c0000000-0000-0000-0000-000000000001', keyword: 'abuse',  action: 'hold' },
  { church_id: 'c0000000-0000-0000-0000-000000000002', keyword: 'crisis', action: 'escalate' },
  { church_id: 'c0000000-0000-0000-0000-000000000002', keyword: 'spam',   action: 'hold' },
], { onConflict: 'id', ignoreDuplicates: true })

if (kwError) { console.error('Keyword rule upsert failed:', kwError.message); process.exit(1) }

const { error: ecError } = await supabase.from('escalation_contacts').upsert([
  { church_id: 'c0000000-0000-0000-0000-000000000001', email: graceAdmin.email,    label: 'Senior Pastor' },
  { church_id: 'c0000000-0000-0000-0000-000000000002', email: hillsideAdmin.email, label: 'Care Team' },
], { onConflict: 'id', ignoreDuplicates: true })

if (ecError) { console.error('Escalation contact upsert failed:', ecError.message); process.exit(1) }
console.log('  ✓ 4 keyword rules, 2 escalation contacts')

// ── 5. Submissions ────────────────────────────────────────────────────────────
console.log('\n[5/6] Upserting submissions...')

const submissions = [
  // Grace Chapel
  {
    id: '50000000-0000-0000-0000-000000000001',
    church_id: 'c0000000-0000-0000-0000-000000000001',
    user_id: graceAdmin.authId,
    type: 'prayer', content: 'Please pray for my family as we navigate a difficult season of change.',
    is_anonymous: false, status: 'approved', visibility: 'public',
    priority: 'normal', contact_requested: false, update_used: false,
    moderated_by: graceAdmin.authId,
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    church_id: 'c0000000-0000-0000-0000-000000000001',
    user_id: graceAdmin.authId,
    type: 'praise', content: 'Praise God — the job offer came through after months of searching!',
    is_anonymous: false, status: 'pending', visibility: 'public',
    priority: 'normal', contact_requested: false, update_used: false,
    moderated_by: null,
  },
  {
    id: '50000000-0000-0000-0000-000000000003',
    church_id: 'c0000000-0000-0000-0000-000000000001',
    user_id: graceAdmin.authId,
    type: 'prayer', content: 'Struggling with thoughts of self-harm. Please pray.',
    is_anonymous: false, status: 'held', visibility: 'public',
    priority: 'urgent', contact_requested: true, update_used: false,
    moderated_by: graceAdmin.authId,
  },
  // Hillside Community
  {
    // approved+public on embed-enabled church — primary fixture for insert_embed_reaction
    id: '50000000-0000-0000-0000-000000000004',
    church_id: 'c0000000-0000-0000-0000-000000000002',
    user_id: hillsideAdmin.authId,
    type: 'prayer', content: 'Praying for our community outreach event next weekend.',
    is_anonymous: false, status: 'approved', visibility: 'public',
    priority: 'normal', contact_requested: false, update_used: false,
    moderated_by: hillsideAdmin.authId,
  },
  {
    // anonymous + approved + private: should not appear on embed wall
    id: '50000000-0000-0000-0000-000000000005',
    church_id: 'c0000000-0000-0000-0000-000000000002',
    user_id: hillsideMember.authId,
    type: 'prayer', content: 'Anonymous prayer request for a private health concern.',
    is_anonymous: true, status: 'approved', visibility: 'private',
    priority: 'normal', contact_requested: false, update_used: false,
    moderated_by: hillsideAdmin.authId,
  },
  {
    // rejected: should be invisible to anon (cross-status RLS test)
    id: '50000000-0000-0000-0000-000000000006',
    church_id: 'c0000000-0000-0000-0000-000000000002',
    user_id: hillsideMember.authId,
    type: 'prayer', content: 'This submission was rejected for violating community guidelines.',
    is_anonymous: false, status: 'rejected', visibility: 'public',
    priority: 'normal', contact_requested: false, update_used: false,
    moderated_by: hillsideAdmin.authId,
  },
]

const { error: subError } = await supabase.from('submissions').upsert(submissions, { onConflict: 'id' })
if (subError) { console.error('Submission upsert failed:', subError.message); process.exit(1) }
console.log(`  ✓ ${submissions.length} submissions`)

// ── 6. Reactions ──────────────────────────────────────────────────────────────
console.log('\n[6/6] Inserting reactions...')

// Can't upsert reactions cleanly (no unique constraint to conflict on), so skip if any exist
const { count: existingReactions } = await supabase
  .from('reactions')
  .select('*', { count: 'exact', head: true })

if (existingReactions > 0) {
  console.log(`  ↩  ${existingReactions} reactions already exist, skipping`)
} else {
  const { error: rxError } = await supabase.from('reactions').insert([
    { submission_id: '50000000-0000-0000-0000-000000000001', church_id: 'c0000000-0000-0000-0000-000000000001', user_id: graceAdmin.authId,    emoji: 'prayer', source: 'app' },
    { submission_id: '50000000-0000-0000-0000-000000000004', church_id: 'c0000000-0000-0000-0000-000000000002', user_id: hillsideAdmin.authId,  emoji: 'prayer', source: 'app' },
    { submission_id: '50000000-0000-0000-0000-000000000004', church_id: 'c0000000-0000-0000-0000-000000000002', user_id: null,                   emoji: 'praise', source: 'embed', embed_visitor_id: 'a1b2c3d4-0000-0000-0000-000000000000' },
  ])
  if (rxError) { console.error('Reaction insert failed:', rxError.message); process.exit(1) }
  console.log('  ✓ 3 reactions (1 app, 1 app, 1 embed)')
}

// ── Done ───────────────────────────────────────────────────────────────────────
console.log('\n✓ Staging seed complete.')
console.log('\nTest credentials (staging only):')
console.log('  staging-grace-admin@prayerwallapp.com    / StagingTest2026!')
console.log('  staging-hillside-admin@prayerwallapp.com / StagingTest2026!')
console.log('  staging-hillside-member@prayerwallapp.com / StagingTest2026!')
console.log('\nEmbed test fixture:')
console.log('  Church: hillside-staging (embed_enabled=true)')
console.log('  Submission: 50000000-0000-0000-0000-000000000004 (approved+public)')
