'use strict';
/**
 * 签发用户 token（给客户端用 / 联调用）
 *   SERVER_SECRET=xxx node src/mint.js --user customer001 --days 30
 */
const auth = require('./auth');

const a = process.argv;
const get = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };

const user = get('user');
if (!user) { console.error('用法: node src/mint.js --user <userId> [--days 30]'); process.exit(1); }
try {
  console.log(auth.issue(user, Number(get('days', '30'))));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
