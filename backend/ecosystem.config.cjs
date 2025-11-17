module.exports = {
  apps: [
    {
      name: 'jastipin-api',
      script: 'pnpm',
      args: 'start',
      cwd: '/app/backend',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '/var/log/pm2/jastipin-api-error.log',
      out_file: '/var/log/pm2/jastipin-api-out.log',
      log_file: '/var/log/pm2/jastipin-api-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};
