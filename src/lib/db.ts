import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER?.trim()!,
  port: 1433,
  database: process.env.DB_NAME?.trim()!,
  user: process.env.DB_USER?.trim()!,
  password: process.env.DB_PASSWORD?.trim()!,
  options: {
    encrypt: true,
    trustServerCertificate: true, // A veces Azure necesita esto en entornos de red locales
    enableArithAbort: true,
  },
  connectionTimeout: 60000, // Aumentado a 60s
  requestTimeout: 60000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export async function getDbConnection(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect();
  }
  return poolPromise;
}

export async function queryDb<T = any>(query: string, params?: Record<string, any>): Promise<T[]> {
  const pool = await getDbConnection();
  const request = pool.request();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
  }
  const result = await request.query(query);
  return result.recordset as T[];
}
