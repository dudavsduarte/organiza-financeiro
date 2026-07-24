import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok, hottok'
}

const activeEvents = new Set([
  'PURCHASE_APPROVED',
  'PURCHASE_COMPLETE'
])

const blockedEvents = new Set([
  'PURCHASE_CANCELED',
  'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK',
  'PURCHASE_EXPIRED',
  'PURCHASE_DELAYED',
  'SUBSCRIPTION_CANCELLATION',
  'SUBSCRIPTION_OVERDUE'
])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const expectedHottok = Deno.env.get('HOTMART_HOTTOK')
  const receivedHottok = req.headers.get('x-hotmart-hottok') || req.headers.get('hottok')
  if (expectedHottok && receivedHottok !== expectedHottok) return json({ error: 'Unauthorized' }, 401)

  let payload: Record<string, any>
  try { payload = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const eventType = String(payload.event || payload.event_type || payload.type || '').toUpperCase()
  const data = payload.data || payload
  const buyerEmail = String(data?.buyer?.email || data?.subscriber?.email || data?.purchase?.buyer?.email || '').trim().toLowerCase()
  const transactionId = String(data?.purchase?.transaction || data?.transaction || data?.subscription?.subscriber?.code || '')
  const productId = String(data?.product?.id || data?.product?.ucode || data?.purchase?.product?.id || '')
  const eventId = String(payload.id || payload.event_id || `${eventType}:${transactionId}:${payload.creation_date || Date.now()}`)

  if (!eventType || !buyerEmail) return json({ error: 'Missing event or buyer email' }, 422)

  const configuredProduct = Deno.env.get('HOTMART_PRODUCT_ID')
  if (configuredProduct && productId && configuredProduct !== productId) return json({ ignored: true, reason: 'Different product' }, 200)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const { error: logError } = await supabase.from('hotmart_events').upsert({
    event_id: eventId,
    event_type: eventType,
    buyer_email: buyerEmail,
    transaction_id: transactionId || null,
    payload
  }, { onConflict: 'event_id', ignoreDuplicates: true })
  if (logError) console.error('event log:', logError)

  let accessStatus: 'active' | 'blocked' | 'pending' | null = null
  if (activeEvents.has(eventType)) accessStatus = 'active'
  if (blockedEvents.has(eventType)) accessStatus = 'blocked'
  if (!accessStatus) return json({ received: true, ignored: true, event: eventType }, 200)

  const accessUntil = toIsoDate(data?.subscription?.date_next_charge)
  const { error: grantError } = await supabase.from('access_grants').upsert({
    email: buyerEmail,
    access_status: accessStatus,
    plan: 'premium',
    product_id: productId || null,
    transaction_id: transactionId || null,
    purchase_status: eventType,
    access_until: accessUntil,
    updated_at: new Date().toISOString()
  }, { onConflict: 'email' })
  if (grantError) return json({ error: grantError.message }, 500)

  const { error: profileError } = await supabase.from('profiles').update({
    access_status: accessStatus,
    plan: 'premium',
    access_until: accessUntil,
    updated_at: new Date().toISOString()
  }).eq('email', buyerEmail)
  if (profileError) return json({ error: profileError.message }, 500)

  return json({ received: true, event: eventType, email: buyerEmail, access_status: accessStatus }, 200)
})

function toIsoDate(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'number') return new Date(value).toISOString()
  if (typeof value === 'string') {
    const numeric = Number(value)
    const date = Number.isFinite(numeric) && value.trim() !== '' ? new Date(numeric) : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  return null
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
