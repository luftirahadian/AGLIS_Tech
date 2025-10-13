module.exports = {
  apps: [
    {
      name: 'aglis-backend-1',
      script: './backend/src/server.js',
      cwd: '/home/aglis/AGLIS_Tech',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        INSTANCE_ID: '1'
      },
      error_file: './logs/backend-error-1.log',
      out_file: './logs/backend-out-1.log',
      log_file: './logs/backend-combined-1.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aglis-backend-2',
      script: './backend/src/server.js',
      cwd: '/home/aglis/AGLIS_Tech',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        INSTANCE_ID: '2'
      },
      error_file: './logs/backend-error-2.log',
      out_file: './logs/backend-out-2.log',
      log_file: './logs/backend-combined-2.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aglis-backend-3',
      script: './backend/src/server.js',
      cwd: '/home/aglis/AGLIS_Tech',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        INSTANCE_ID: '3'
      },
      error_file: './logs/backend-error-3.log',
      out_file: './logs/backend-out-3.log',
      log_file: './logs/backend-combined-3.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'aglis-backend-4',
      script: './backend/src/server.js',
      cwd: '/home/aglis/AGLIS_Tech',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        INSTANCE_ID: '4'
      },
      error_file: './logs/backend-error-4.log',
      out_file: './logs/backend-out-4.log',
      log_file: './logs/backend-combined-4.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
