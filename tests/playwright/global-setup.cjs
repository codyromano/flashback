const { spawn } = require('child_process');

module.exports = async () => {
  // Start Vite dev server
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'ignore',
    detached: true,
  });

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Store server PID for teardown
  global.__FLASHBACK_DEV_SERVER_PID__ = devServer.pid;
};
