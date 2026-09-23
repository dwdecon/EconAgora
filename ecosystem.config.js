module.exports = {
  apps: [{
    name: 'econagora',
    script: '/var/www/EconAgora/.next/standalone/server.js',
    cwd: '/var/www/EconAgora/.next/standalone',
    env: {
      NODE_ENV: 'production',
      HOSTNAME: '127.0.0.1',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: '1'
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    restart_delay: 3000,
    max_restarts: 5,
    min_uptime: '10s',
    log_file: '/home/ubuntu/.pm2/logs/econagora.log',
    out_file: '/home/ubuntu/.pm2/logs/econagora-out.log',
    error_file: '/home/ubuntu/.pm2/logs/econagora-error.log',
    merge_logs: true,
    time: true
  }]
};
