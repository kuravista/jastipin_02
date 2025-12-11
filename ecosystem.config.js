module.exports = {
  apps: [
    {
      name: 'backend',
      script: './node_modules/.bin/tsx',
      args: 'watch src/index.ts',
      cwd: './backend',
      env: {
        NODE_ENV: 'development'
      },
      watch: ['src'],
      ignore_watch: ['node_modules', 'dist', '.prisma']
    },
    {
      name: 'frontend',
      script: './node_modules/.bin/next',
      args: 'dev',
      cwd: './frontend',
      env: {
        NODE_ENV: 'development'
      },
      watch: ['app', 'components', 'lib'],
      ignore_watch: ['node_modules', '.next']
    }
  ]
}
