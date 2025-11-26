import { createConnection } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function testSqlConnection() {
  console.log('🔍 Testing SQL Server connection to Protheus...\n');

  console.log('Connection details:');
  console.log(`  Host: ${process.env.PROTHEUS_DB_HOST}`);
  console.log(`  Port: ${process.env.PROTHEUS_DB_PORT || '1433'}`);
  console.log(`  Database: ${process.env.PROTHEUS_DB_DATABASE}`);
  console.log(`  Username: ${process.env.PROTHEUS_DB_USERNAME}`);
  console.log(`  Password: ${'*'.repeat(process.env.PROTHEUS_DB_PASSWORD?.length || 0)}\n`);

  try {
    const connection = await createConnection({
      type: 'mssql',
      host: process.env.PROTHEUS_DB_HOST,
      port: parseInt(process.env.PROTHEUS_DB_PORT || '1433'),
      username: process.env.PROTHEUS_DB_USERNAME,
      password: process.env.PROTHEUS_DB_PASSWORD,
      database: process.env.PROTHEUS_DB_DATABASE,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      extra: {
        validateConnection: false,
      },
    });

    console.log('✅ Connection successful!\n');

    // Test query to SX3010
    console.log('🔍 Testing query to SX3010...');
    const result = await connection.query(
      `SELECT TOP 5 X3_ARQUIVO, X3_CAMPO, X3_TITULO, D_E_L_E_T_ FROM SX3010 WHERE D_E_L_E_T_ = ''`
    );

    console.log(`✅ Query successful! Found ${result.length} records:\n`);
    result.forEach((record: any) => {
      console.log(`  Table: ${record.X3_ARQUIVO}, Field: ${record.X3_CAMPO}, Title: ${record.X3_TITULO}`);
    });

    await connection.close();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

testSqlConnection();
