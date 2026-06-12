module.exports = {
  apps: [
    {
      name: 'btrip-backend',
      cwd: 'C:/BTRIP/backend',
      script: 'server.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        HOST: '0.0.0.0',
        FRONTEND_URL: 'http://200.200.200.231:5173',
        FRONTEND_URL_EXTERNAL: 'http://46.10.201.238:5173'
      },
      error_file: 'C:/BTRIP/logs/backend-error.log',
      out_file: 'C:/BTRIP/logs/backend-out.log',
      time: true
    },
    {
      name: 'btrip-frontend',
      cwd: 'C:/BTRIP/frontend',
      script: 'node_modules/vite/bin/vite.js',
      args: '--host 0.0.0.0',
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'C:/BTRIP/logs/frontend-error.log',
      out_file: 'C:/BTRIP/logs/frontend-out.log',
      time: true
    }
  ]
};

