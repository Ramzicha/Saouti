import pg from 'pg';

const { Client } = pg;

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'YOUR_POSTGRES_PASSWORD',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL as postgres');

    // Check if user saouti exists
    const userRes = await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'saouti'");
    if (userRes.rowCount === 0) {
      console.log('Creating user saouti...');
      await client.query("CREATE USER saouti WITH PASSWORD 'saouti_local_secret' SUPERUSER");
      console.log('User saouti created.');
    } else {
      console.log('Updating password for user saouti...');
      await client.query("ALTER USER saouti WITH PASSWORD 'saouti_local_secret' SUPERUSER");
      console.log('User saouti password updated.');
    }

    // Check if database saouti exists
    const dbRes = await client.query("SELECT 1 FROM pg_database WHERE datname = 'saouti'");
    if (dbRes.rowCount === 0) {
      console.log('Creating database saouti...');
      await client.query("CREATE DATABASE saouti OWNER saouti");
      console.log('Database saouti created.');
    } else {
      console.log('Database saouti already exists.');
    }

    await client.end();
    console.log('Setup completed successfully.');
  } catch (err) {
    console.error('Setup error:', err);
    process.exit(1);
  }
}

main();
