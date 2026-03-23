module.exports = {
  apps: [
    {
      name: 'devileye-api',
      script: './backend/src/server.js',
      cwd: '/var/www/devileye',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'file:/var/www/devileye/backend/prisma/devileye.db',
        JWT_SECRET: 'CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET_IN_PRODUCTION',
        UPLOADS_DIR: '/var/www/devileye/backend/uploads',
        FRONTEND_URL: 'https://seudominio.com',
      },
      error_file: '/var/log/pm2/devileye-error.log',
      out_file: '/var/log/pm2/devileye-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
