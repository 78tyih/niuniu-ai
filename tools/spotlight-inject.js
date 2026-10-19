// 牛牛AI 教学录屏 · 鼠标高光注入脚本
// 用途：在 agent-browser 录屏前注入，让「点了哪个按钮」可视化。
//   - 橙色箭头鼠标光标，跟随操作移动（transition 平滑）
//   - 点击前目标按钮放大 + 橙色光圈扩散（spotlight）
// 用法：agent-browser eval "$(cat tools/spotlight-inject.js)"  注入一次
//       然后录制流程里 agent-browser eval "nnSpot.move('#xxx')" / "nnSpot.hit('#xxx')"
(function () {
  if (window.nnSpot) return;
  var cur = document.createElement('div');
  cur.id = 'nn-cursor';
  cur.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))"><path d="M5 3l14 7.5-6.3 1.8L9 19z" fill="#FF6A1A" stroke="#fff" stroke-width="1.6"/></svg>';
  cur.style.cssText = 'position:fixed;z-index:99999;left:-100px;top:-100px;pointer-events:none;' +
    'transition:left .38s cubic-bezier(.22,1,.36,1),top .38s cubic-bezier(.22,1,.36,1);';
  document.body.appendChild(cur);

  function boxOf(sel) {
    var el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { el: el, r: r };
  }
  function center(sel) {
    var b = boxOf(sel);
    if (!b) return null;
    return { el: b.el, x: b.r.left + b.r.width / 2, y: b.r.top + b.r.height / 2 };
  }
  // 移动鼠标到目标中心
  function move(sel) {
    var c = center(sel);
    if (!c) return false;
    cur.style.left = (c.x - 10) + 'px';
    cur.style.top = (c.y - 6) + 'px';
    return true;
  }
  // 点击高光：光圈扩散 + 目标放大 + 橙色描边
  function hit(sel) {
    var c = center(sel);
    if (!c) return false;
    var ring = document.createElement('div');
    ring.style.cssText = 'position:fixed;z-index:99998;width:34px;height:34px;border-radius:50%;' +
      'border:4px solid #FF6A1A;box-shadow:0 0 0 10px rgba(255,106,26,.28);pointer-events:none;';
    ring.style.left = (c.x - 17) + 'px';
    ring.style.top = (c.y - 17) + 'px';
    document.body.appendChild(ring);
    try {
      ring.animate(
        [{ transform: 'scale(.7)', opacity: 1 }, { transform: 'scale(2.6)', opacity: 0 }],
        { duration: 750, fill: 'forwards' }
      ).onfinish = function () { ring.remove(); };
    } catch (e) { ring.remove(); }
    // 目标放大 + 描边
    var el = c.el;
    var prev = el.style.transition;
    el.style.transition = 'transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s';
    el.style.transform = 'scale(1.1)';
    el.style.boxShadow = '0 0 0 4px rgba(255,106,26,.65)';
    setTimeout(function () {
      el.style.transform = '';
      el.style.boxShadow = '';
      setTimeout(function () { el.style.transition = prev; }, 250);
    }, 650);
    return true;
  }
  window.nnSpot = { move: move, hit: hit, cursor: cur };
})();
