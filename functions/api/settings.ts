type Env = { DB: D1Database };

const KEYS = ['wa_number', 'popup_enabled', 'popup_text', 'popup_delay_sec', 'ga4_id'] as const;

const DEFAULTS: Record<string, string> = {
  wa_number: '6285924041004',
  popup_enabled: '1',
  popup_text: 'Hai! Mau tanya lebih jauh tentang program?',
  popup_delay_sec: '8',
  ga4_id: '',
};

export async function getSettings(env: Env): Promise<Record<string, string>> {
  const rows = await env.DB.prepare(
    `SELECT k, v FROM settings WHERE k IN (${KEYS.map(() => '?').join(', ')})`,
  )
    .bind(...KEYS)
    .all<{ k: string; v: string }>();

  const out = { ...DEFAULTS };
  for (const r of rows.results ?? []) out[r.k] = r.v;
  return out;
}

export const onRequestGet = async (context: { env: Env }): Promise<Response> => {
  const settings = await getSettings(context.env);
  return new Response(JSON.stringify(settings), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
};
