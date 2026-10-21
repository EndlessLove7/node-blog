// PM2 应用配置集合。
module.exports = {
  // apps 中的每个对象定义一个由 PM2 管理的应用进程。
  apps: [
    {
      // PM2 中显示的应用名称。
      name: 'node-blog',
      // 应用启动入口。
      script: './http-server.js',
      // 应用工作目录，使用当前配置文件所在目录。
      cwd: __dirname,
      // 使用 cluster 模式运行 Node.js 应用。
      exec_mode: 'cluster',
      // 启动一个 worker 实例。 eg: max，表示进程数：max=CPU核心数
      instances: 1,
      // 应用异常退出时自动重启。
      autorestart: true,
      // 不监视文件变化，避免生产环境因文件更新而频繁重启。
      watch: false,
      // 进程内存超过 512 MB 时自动重启。
      max_memory_restart: '512M',
      // 进程至少运行 10 秒才视为启动成功。
      min_uptime: '10s',
      // 连续异常重启最多 10 次，超过后停止重启。
      max_restarts: 10,
      // 自动重启前等待 3 秒。
      restart_delay: 3000,
      // 发送关闭信号后，最多等待 10 秒再强制结束进程。
      kill_timeout: 10000,
      // 使用 --env production 启动时注入的生产环境变量。
      env_production: {
        // 告知应用以生产模式运行。
        NODE_ENV: 'production',
      },
    },
  ],
};
