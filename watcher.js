const { execSync } = require('child_process');

const BRANCH = 'claude/portfolio-website-login-OfgMI';
const DIR = __dirname;

function run(cmd) {
  return execSync(cmd, { cwd: DIR, encoding: 'utf-8' }).trim();
}

function checkForUpdates() {
  try {
    run('git fetch origin');
    const local = run('git rev-parse HEAD');
    const remote = run(`git rev-parse origin/${BRANCH}`);

    if (local !== remote) {
      console.log(`[watcher] Update detected — pulling and restarting...`);
      run(`git pull origin ${BRANCH}`);
      run('npm install --omit=dev');
      run('pm2 restart portfolio');
      console.log(`[watcher] Done. Running commit: ${remote.slice(0, 7)}`);
    }
  } catch (err) {
    console.error('[watcher] Error:', err.message);
  }
}

console.log('[watcher] Started — checking for updates every 60 seconds.');
checkForUpdates();
setInterval(checkForUpdates, 60 * 1000);
