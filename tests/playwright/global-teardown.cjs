module.exports = async () => {
  // Kill the dev server after tests
  if (global.__FLASHBACK_DEV_SERVER_PID__) {
    try {
      process.kill(global.__FLASHBACK_DEV_SERVER_PID__);
    } catch (e) {
      // Ignore if already killed
    }
  }
};
