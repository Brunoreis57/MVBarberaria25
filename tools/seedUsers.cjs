const { createClient } = require('@supabase/supabase-js');

function getArg(name, def) {
  const idx = process.argv.findIndex(a => a === `--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

async function getOrCreateUser(admin, email, password, name) {
  const res = await admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });
  if (!res.error && res.data && res.data.user) return res.data.user;
  if (res.error && String(res.error.message || '').toLowerCase().includes('already')) {
    const list = await admin.listUsers();
    const existing = (list.data?.users || []).find(u => u.email === email);
    if (existing) return existing;
  }
  if (res.error) throw res.error;
  throw new Error('Failed to create or find user');
}

async function main() {
  const url = getArg('url');
  const key = getArg('key');
  if (!url || !key) {
    console.error('Missing --url and/or --key');
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const admin = supabase.auth.admin;

  const adminEmail = 'mvadministrador@gmail.com';
  const adminPass = 'mv2025@';
  const adminName = 'Administrador';

  const barberEmail = 'alissonmv@gmail.com';
  const barberPass = 'alisson2025';
  const barberName = 'Alisson';

  const adminUser = await getOrCreateUser(admin, adminEmail, adminPass, adminName);
  const barberUser = await getOrCreateUser(admin, barberEmail, barberPass, barberName);

  const roleAdmin = await supabase.from('user_roles').upsert({ user_id: adminUser.id, role: 'admin' }, { onConflict: 'user_id,role' });
  if (roleAdmin.error) throw roleAdmin.error;

  const roleBarber = await supabase.from('user_roles').upsert({ user_id: barberUser.id, role: 'barber' }, { onConflict: 'user_id,role' });
  if (roleBarber.error) throw roleBarber.error;

  const barberRow = await supabase.from('barbeiros').upsert({ user_id: barberUser.id, nome: barberName, ativo: true });
  if (barberRow.error) throw barberRow.error;

  console.log('Seed complete:', {
    admin: adminUser.id,
    barber: barberUser.id,
  });
}

main().catch(e => { console.error(e); process.exit(1); });