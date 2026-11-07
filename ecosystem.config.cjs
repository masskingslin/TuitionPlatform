module.exports = {
  apps: [
    {
      name: 'tuition-backend',
      script: 'server.ts',
      interpreter: 'node_modules/.bin/tsx',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
