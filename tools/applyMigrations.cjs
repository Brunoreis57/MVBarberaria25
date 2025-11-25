const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function getArg(name, def) {
  const idx = process.argv.findIndex(a => a === `--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

async function main() {
  const projectRef = getArg('project', 'jnchxpnecbpehwmxrstd');
  const host = getArg('host', `db.${projectRef}.supabase.co`);
  const port = parseInt(getArg('port', '5432'), 10);
  const database = getArg('db', 'postgres');
  const user = getArg('user', 'postgres');
  const password = getArg('password');
  const migrationsDir = getArg('dir', path.join(process.cwd(), 'supabase', 'migrations'));

  if (!password) {
    console.error('Missing --password');
    process.exit(1);
  }

  const client = new Client({
    host,
    port,
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`Connecting to ${user}@${host}:${port}/${database}`);
  await client.connect();

  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files in ${migrationsDir}`);

  for (const file of files) {
    const full = path.join(migrationsDir, file);
    const sql = fs.readFileSync(full, 'utf8');
    console.log(`Applying ${file} (${sql.length} bytes)`);
    try {
      await client.query(sql);
      console.log(`Applied ${file}`);
    } catch (err) {
      console.error(`Failed on ${file}:`, err.message);
      await client.end();
      process.exit(2);
    }
  }

  await client.end();
  console.log('All migrations applied successfully');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});