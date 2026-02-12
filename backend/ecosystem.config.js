module.exports = {
  apps: [{
    name: 'mator-life-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      HOST: '0.0.0.0',
      // IMPORTANT: MONGODB_URI va boshqa sensitive variables ni .env.production dan o'qiladi
      // Agar PM2 env_file ni to'g'ri o'qimasa, bu yerga to'g'ridan-to'g'ri qo'shing
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Production optimizations
    node_args: '--max-old-space-size=2048',
    
    // Restart strategies
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Graceful shutdown
    kill_timeout: 5000,
    
    // Monitoring
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
