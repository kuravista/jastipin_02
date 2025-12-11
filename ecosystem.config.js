module.exports = {
  apps: [
    {
      name: 'backend',
      interpreter: 'bash',
      script: '-c',
      args: 'cd backend && pnpm run dev',
      env: {
        NODE_ENV: 'development'
      },
      watch: ['backend/src'],
      ignore_watch: ['backend/node_modules', 'backend/dist']
    },
    {
      name: 'frontend',
      interpreter: 'bash',
      script: '-c',
      args: 'cd frontend && pnpm run dev',
      env: {
        NODE_ENV: 'development'
      },
      watch: ['frontend/app', 'frontend/components'],
      ignore_watch: ['frontend/node_modules', 'frontend/.next']
    }
  ]
}
