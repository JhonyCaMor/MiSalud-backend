const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const jwtSecret =
  process.env.JWT_SECRET ?? (isProduction ? undefined : 'dev-secret-misalud');

if (isProduction && !jwtSecret) {
  throw new Error(
    'JWT_SECRET es obligatorio en producción. Configúralo en el entorno.',
  );
}

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv,
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'misalud',
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  },
});
