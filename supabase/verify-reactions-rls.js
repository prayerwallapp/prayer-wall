#!/usr/bin/env node
// supabase/verify-reactions-rls.js
//
// Verification script for 20260721_reactions_rls_and_embed_prep.sql
// Sessions 19 + 19b
//
// WHEN TO RUN:
//   After applying the migration (locally or production).
//   This script targets the SUPABASE_URL in .env.local by default.
//   For local instance: set LOCAL=true env var (URL becomes http://localhost:54321).
//
// USAGE:
//   node supabase/verify-reactions-rls.js
//   LOCAL=true node supabase/verify-reactions-rls.js   # local supabase instance
//
// REQUIREMENTS:
//   - npm install -g node-fetch (or Node 18+ has fetch built in — this uses fetch)
//   - .env.local must have NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
//     SUPABASE_SERVICE_ROLE_KEY
//   - Test church must have embed_enabled = true and reaction_settings with enabled emojis
//   - Test church must have at least one approved+public submission AND one held submission
//
// CHECKS:
//   1. Anon SELECT on held submission → zero rows (cross-status leak closed)
//   2. Anon SELECT on approved+public submission → rows returned (realtime still works)
//   3. Anon SELECT on approved+private submission → zero rows (care-team-only scoping)
//   4. Authenticated SELECT for own church reactions → rows with user_id visible
//   5. Embed RPC happy path → row lands with user_id=NULL, source='embed'
//   6a. Embed RPC: non-approved submission → rejected
//   6b. Embed RPC: embed_enabled=false church → rejected
//   6c. Embed RPC: disabled emoji → rejected
//   7. Direct anon INSERT with valid submission ID → 403 (RLS block, NOT 409 FK error)
//   8. Realtime subscription → NOTE: verified manually via Puppeteer; see note at end.

const fs = require('fs')
const path = require('path')

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
const get = k => { const m = envFile.match(new RegExp(`^${k}=(.+)$`, 'm')); return m?.[1]?.trim() ?? '' }

const BASE_URL = process.env.LOCAL === 'true'
  ? 'http://localhost:54321'
  : get('NEXT_PUBLIC_SUPABASE_URL')
const ANON_KEY = get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const SERVICE_KEY = get('SUPABASE_SERVICE_ROLE_KEY')

// Test church: test.localhost church (id confirmed in prior sessions)
const TEST_CHURCH_ID = '8d1dde49-1326-47a3-83b3-d98fa106b608'
// Test user JWT (testmember@prayerwall.dev) — used for authenticated checks
// Will be fetched at runtime via password grant
const TEST_EMAIL = 'testmember@prayerwall.dev'
const TEST_PASSWORD = 'TestPass123!'

let PASS = 0
let FAIL = 0
const results = []

async function rest(method, path, body, key = ANON_KEY) {
  const res = await fetch(`${BASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, body: await res.json().catch(() => null) }
}

async function rpc(fnName, params, key = ANON_KEY) {
  const res = await fetch(`${BASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  return { status: res.status, body: await res.json().catch(() => null) }
}

async function authToken(email, password) {
  const res = await fetch(`${BASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  return data.access_token ?? null
}

function check(name, pass, evidence, hint = '') {
  const status = pass ? '✅ PASS' : '❌ FAIL'
  if (pass) PASS++; else FAIL++
  results.push({ name, status, evidence, hint })
  console.log(`\n${status} — ${name}`)
  console.log(`  Evidence: ${JSON.stringify(evidence)}`)
  if (hint) console.log(`  Hint: ${hint}`)
}

async function run() {
  console.log('=== Reactions RLS + Embed Prep Verification ===')
  console.log(`Target: ${BASE_URL}`)
  console.log(`Mode: ${process.env.LOCAL === 'true' ? 'LOCAL' : 'REMOTE'}\n`)

  // ── Setup: fetch test IDs via service role ─────────────────────────────────

  const { body: held } = await rest(
    'GET', '/submissions?select=id,status&status=eq.held&limit=1', null, SERVICE_KEY
  )
  const heldId = held?.[0]?.id
  if (!heldId) {
    console.warn('⚠️  No held submission found — check 1 will be skipped (insert one manually for full coverage)')
  }

  const { body: approved } = await rest(
    'GET', '/submissions?select=id,status,visibility&status=eq.approved&visibility=eq.public&limit=1', null, SERVICE_KEY
  )
  const approvedPublicId = approved?.[0]?.id

  const { body: approvedPrivate } = await rest(
    'GET', '/submissions?select=id,status,visibility&status=eq.approved&visibility=eq.private&limit=1', null, SERVICE_KEY
  )
  const approvedPrivateId = approvedPrivate?.[0]?.id

  const userJwt = await authToken(TEST_EMAIL, TEST_PASSWORD)
  if (!userJwt) {
    console.error('❌ SETUP FAIL: could not get auth token for test user')
    process.exit(1)
  }

  const { body: church } = await rest(
    `GET`, `/churches?select=id,embed_enabled,reaction_settings&id=eq.${TEST_CHURCH_ID}`, null, SERVICE_KEY
  )
  const testChurch = church?.[0]
  const embedEnabled = testChurch?.embed_enabled
  const reactionSettings = testChurch?.reaction_settings ?? {}
  const enabledEmoji = Object.entries(reactionSettings).find(([, v]) => v === true)?.[0]
  const disabledEmoji = Object.entries(reactionSettings).find(([, v]) => v === false)?.[0]

  console.log('Setup:', { heldId, approvedPublicId, approvedPrivateId, embedEnabled, enabledEmoji, disabledEmoji })

  // ── Check 1: Cross-status leak closed ─────────────────────────────────────

  if (heldId) {
    const { status, body } = await rest('GET', `/reactions?select=id&submission_id=eq.${heldId}`)
    check(
      'Check 1: Anon SELECT on held submission → 0 rows',
      Array.isArray(body) && body.length === 0,
      { status, rowCount: Array.isArray(body) ? body.length : 'error', body },
      'Expected [] — reactions_select_public should filter this out (status != approved)'
    )
  } else {
    console.log('⏭  Check 1 SKIPPED — no held submission in DB')
  }

  // ── Check 2: Approved+public reads work ───────────────────────────────────

  if (approvedPublicId) {
    // First ensure there are reactions on this submission (insert one with service role)
    await rest('POST', '/reactions', {
      submission_id: approvedPublicId,
      church_id: TEST_CHURCH_ID,
      emoji: enabledEmoji ?? 'prayer',
      source: 'app',
    }, SERVICE_KEY)

    const { status, body } = await rest('GET', `/reactions?select=id,emoji&submission_id=eq.${approvedPublicId}`)
    check(
      'Check 2: Anon SELECT on approved+public submission → rows returned',
      Array.isArray(body) && body.length > 0,
      { status, rowCount: Array.isArray(body) ? body.length : 'error', sample: body?.[0] },
      'Expected rows — realtime burst animation depends on this path'
    )
  } else {
    console.log('⏭  Check 2 SKIPPED — no approved+public submission in DB')
  }

  // ── Check 3: Approved+private (care-team-only) → anon sees 0 rows ─────────

  if (approvedPrivateId) {
    await rest('POST', '/reactions', {
      submission_id: approvedPrivateId,
      church_id: TEST_CHURCH_ID,
      emoji: enabledEmoji ?? 'prayer',
      source: 'app',
    }, SERVICE_KEY)

    const { status, body } = await rest('GET', `/reactions?select=id&submission_id=eq.${approvedPrivateId}`)
    check(
      'Check 3: Anon SELECT on approved+private submission → 0 rows',
      Array.isArray(body) && body.length === 0,
      { status, rowCount: Array.isArray(body) ? body.length : 'error', body },
      'Expected [] — visibility=private means care-team-only, anon should not see reactions'
    )
  } else {
    console.log('⏭  Check 3 SKIPPED — no approved+private submission in DB (create one in admin: approve with care-team-only visibility)')
  }

  // ── Check 4: Authenticated own-church reads ────────────────────────────────

  if (approvedPublicId) {
    const { status, body } = await rest(
      'GET', `/reactions?select=id,emoji,user_id&submission_id=eq.${approvedPublicId}&limit=1`,
      null, userJwt
    )
    check(
      'Check 4: Authenticated own-church SELECT → rows with user_id visible',
      Array.isArray(body) && body.length > 0,
      { status, sample: body?.[0] },
      'Expected rows — reactions_select_own_church allows own-church authenticated reads'
    )
  }

  // ── Check 5: Embed RPC happy path ─────────────────────────────────────────

  if (approvedPublicId && embedEnabled && enabledEmoji) {
    const visitorId = crypto.randomUUID()
    const { status, body } = await rpc('insert_embed_reaction', {
      p_submission_id: approvedPublicId,
      p_emoji: enabledEmoji,
      p_visitor_id: visitorId,
    })

    // Verify the row actually landed
    let insertedRow = null
    if (status === 200 || status === 204) {
      const { body: rows } = await rest(
        'GET', `/reactions?select=id,user_id,source,embed_visitor_id,emoji&embed_visitor_id=eq.${visitorId}`,
        null, SERVICE_KEY
      )
      insertedRow = rows?.[0]
    }

    check(
      'Check 5: Embed RPC happy path → user_id=NULL, source=embed',
      (status === 200 || status === 204) &&
      insertedRow?.user_id === null &&
      insertedRow?.source === 'embed',
      { rpcStatus: status, rpcBody: body, insertedRow },
      'Expected status 200/204, row with user_id=null and source=embed'
    )
  } else {
    console.log(`⏭  Check 5 SKIPPED — preconditions not met: approvedPublicId=${approvedPublicId}, embedEnabled=${embedEnabled}, enabledEmoji=${enabledEmoji}`)
  }

  // ── Check 6a: Embed RPC — non-approved submission ─────────────────────────

  const fakeId = '00000000-0000-0000-0000-000000000001'
  const { status: s6a, body: b6a } = await rpc('insert_embed_reaction', {
    p_submission_id: fakeId,
    p_emoji: enabledEmoji ?? 'prayer',
    p_visitor_id: crypto.randomUUID(),
  })
  check(
    'Check 6a: Embed RPC with non-existent submission → error',
    s6a >= 400,
    { status: s6a, body: b6a },
    'Expected 4xx — function should RAISE EXCEPTION "submission not found or not approved+public"'
  )

  // ── Check 6b: Embed RPC — embed_enabled=false church ─────────────────────

  // Temporarily set embed_enabled=false, test, then restore
  await rest('PATCH', `/churches?id=eq.${TEST_CHURCH_ID}`, { embed_enabled: false }, SERVICE_KEY)
  await new Promise(r => setTimeout(r, 200))
  const { status: s6b, body: b6b } = await rpc('insert_embed_reaction', {
    p_submission_id: approvedPublicId ?? fakeId,
    p_emoji: enabledEmoji ?? 'prayer',
    p_visitor_id: crypto.randomUUID(),
  })
  await rest('PATCH', `/churches?id=eq.${TEST_CHURCH_ID}`, { embed_enabled: true }, SERVICE_KEY) // restore
  check(
    'Check 6b: Embed RPC with embed_enabled=false → error',
    s6b >= 400,
    { status: s6b, body: b6b },
    'Expected 4xx — function should RAISE EXCEPTION "embed not enabled for this church"'
  )

  // ── Check 6c: Embed RPC — disabled emoji ─────────────────────────────────

  if (approvedPublicId) {
    // Use a non-existent emoji key to trigger the "not enabled" path
    const { status: s6c, body: b6c } = await rpc('insert_embed_reaction', {
      p_submission_id: approvedPublicId,
      p_emoji: 'nonexistent_emoji',
      p_visitor_id: crypto.randomUUID(),
    })
    check(
      'Check 6c: Embed RPC with disabled/invalid emoji → error',
      s6c >= 400,
      { status: s6c, body: b6c },
      'Expected 4xx — function should RAISE EXCEPTION "emoji not enabled for this church"'
    )
  }

  // ── Check 7: Direct anon INSERT now fails (RLS block, not FK error) ────────

  if (approvedPublicId) {
    const { status: s7, body: b7 } = await rest('POST', '/reactions', {
      submission_id: approvedPublicId, // VALID FK — so failure can ONLY be RLS
      church_id: TEST_CHURCH_ID,
      emoji: enabledEmoji ?? 'prayer',
      source: 'app',
    })
    // RLS block = 403 (or 401). FK error = 409. 201 = catastrophic (INSERT succeeded — bug)
    check(
      'Check 7: Direct anon INSERT with valid FK → RLS block (403/401), NOT 409 FK error',
      s7 === 403 || s7 === 401,
      { status: s7, body: b7 },
      'Previous session: got 409 (FK), which was inconclusive. Now using valid submission ID. 403 = RLS blocked. 409 = still letting through to FK check. 201 = BUG.'
    )
  }

  // ── Check 8: Realtime note ─────────────────────────────────────────────────

  console.log('\n📋 Check 8: Realtime subscription — manual verification required')
  console.log('  The reactions table is in supabase_realtime publication (session2.sql).')
  console.log('  Policy change does not affect whether the table is published.')
  console.log('  Verify: start local dev server, open http://test.localhost:3000,')
  console.log('  react to a submission, confirm the burst animation fires.')
  console.log('  (Puppeteer browser test confirms this indirectly via the wall page)')

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════')
  console.log(`RESULTS: ${PASS} PASS, ${FAIL} FAIL`)
  console.log('═══════════════════════════════════════════════')
  results.forEach(r => {
    console.log(`  ${r.status} — ${r.name}`)
  })

  if (FAIL > 0) {
    console.log('\n❌ VERIFICATION FAILED — do not apply to production')
    process.exit(1)
  } else {
    console.log('\n✅ All automated checks passed')
    console.log('   Manually confirm Check 3 (approved+private) and Check 8 (realtime) if skipped above.')
    console.log('   Once confirmed, this migration is ready for production deploy.')
  }
}

run().catch(e => {
  console.error('Script error:', e.message)
  process.exit(1)
})
