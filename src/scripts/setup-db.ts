import pg from 'pg';

const { Client } = pg;

async function main() {
  const host = process.env.PGHOST || 'localhost';
  const port = Number(process.env.PGPORT) || 5432;
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE || 'postgres';

  const appDbUser = process.env.DB_APP_USER || 'saouti';
  const appDbPassword = process.env.DB_APP_PASSWORD || process.env.SAOUTI_DB_PASSWORD;

  if (!password) {
    console.error('Error: Superuser password is required.');
    console.error('Please provide your PostgreSQL superuser password via the PGPASSWORD or POSTGRES_PASSWORD environment variable.');
    console.error('\nExample usage:');
    console.error('  PowerShell: $env:PGPASSWORD="your_password"; $env:DB_APP_PASSWORD="your_app_password"; pnpm tsx src/scripts/setup-db.ts');
    console.error('  Bash:       PGPASSWORD="your_password" DB_APP_PASSWORD="your_app_password" pnpm tsx src/scripts/setup-db.ts\n');
    process.exit(1);
  }

  if (!appDbPassword) {
    console.error('Error: Application database user password is required.');
    console.error('Please provide a password for the application user via DB_APP_PASSWORD or SAOUTI_DB_PASSWORD.');
    process.exit(1);
  }

  const client = new Client({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    await client.connect();
    console.log(`Connected to PostgreSQL at ${host}:${port} as ${user}`);

    // Check if user exists
    const userRes = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [appDbUser]);
    if (userRes.rowCount === 0) {
      console.log(`Creating user ${appDbUser}...`);
      await client.query(`CREATE USER "${appDbUser}" WITH PASSWORD $1 SUPERUSER`, [appDbPassword]);
      console.log(`User ${appDbUser} created.`);
    } else {
      console.log(`Updating password for user ${appDbUser}...`);
      await client.query(`ALTER USER "${appDbUser}" WITH PASSWORD $1 SUPERUSER`, [appDbPassword]);
      console.log(`User ${appDbUser} password updated.`);
    }

    // Check if database exists
    const dbRes = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [appDbUser]);
    if (dbRes.rowCount === 0) {
      console.log(`Creating database ${appDbUser}...`);
      await client.query(`CREATE DATABASE "${appDbUser}" OWNER "${appDbUser}"`);
      console.log(`Database ${appDbUser} created.`);
    } else {
      console.log(`Database ${appDbUser} already exists.`);
    }

    await client.end();
    console.log('Setup completed successfully.');
  } catch (err) {
    console.error('Setup error:', err);
    process.exit(1);
  }
}

main();
