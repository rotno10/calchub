const $ = (s, r = document) => r.querySelector(s);
const fix = (n, d = 2) => n.toLocaleString(undefined, { maximumFractionDigits: d });
const money = n => SITE.currency + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const val = (f, n) => { const s = f.elements[n].value.trim(); return s === '' ? NaN : Number(s); };
const tile = c => `<a class="tile" href="${c.file}"><span class="ico">${c.icon}</span><h3>${c.name}</h3><p>${c.desc}</p><small>${c.cat}</small></a>`;

function res(rows, msg, f = $('form')) {
  const r = $('.result', f);
  r.hidden = false;
  r.className = 'result' + (msg ? ' err' : '');
  r.innerHTML = msg || rows.map(([k, v, c]) => `<div><span>${k}</span><strong class="${c || ''}">${v}</strong></div>`).join('');
}

function layout() {
  document.documentElement.style.setProperty('--accent', SITE.color);
  $('#site-header').innerHTML = `<div class="bar"><a class="logo" href="index.html">${SITE.name}</a><nav><a href="index.html">All calculators</a><button id="theme" aria-label="Toggle light and dark mode"></button></nav></div>`;
  $('#site-footer').innerHTML = `<p>${SITE.footer}</p><p><a href="${SITE.contact}">Contact</a></p>`;
  const rel = $('#related');
  if (rel) {
    const here = document.body.dataset.page + '.html';
    rel.innerHTML = '<h2>More calculators</h2><div class="grid">' + SITE.calculators.filter(c => c.file !== here).slice(0, 3).map(tile).join('') + '</div>';
  }
}

function theme() {
  const root = document.documentElement;
  const set = t => {
    root.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
    $('#theme').textContent = t === 'dark' ? '☀️' : '🌙';
  };
  let t; try { t = localStorage.getItem('theme'); } catch (e) {}
  set(t || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('#theme').onclick = () => set(root.dataset.theme === 'dark' ? 'light' : 'dark');
}

function inputs() {
  document.querySelectorAll('form input:not([type])').forEach(i => { i.type = 'number'; i.inputMode = 'decimal'; i.step = 'any'; });
}

function home() {
  const cats = ['All', ...new Set(SITE.calculators.map(c => c.cat))];
  let cat = 'All';
  const chips = $('#chips'), grid = $('#grid'), q = $('#q');
  const draw = () => {
    const s = q.value.trim().toLowerCase();
    const list = SITE.calculators.filter(c => (cat === 'All' || c.cat === cat) && (c.name + ' ' + c.desc + ' ' + c.cat).toLowerCase().includes(s));
    grid.innerHTML = list.map(tile).join('') || '<p class="muted">No calculators found. Try another search.</p>';
    chips.innerHTML = cats.map(c => `<button class="chip${c === cat ? ' on' : ''}" data-c="${c}">${c}</button>`).join('');
  };
  chips.onclick = e => { if (e.target.dataset.c) { cat = e.target.dataset.c; draw(); } };
  q.oninput = draw;
  draw();
}

function std() {
  const d = $('#display'), h = $('#history');
  let cur = '0', prev = null, op = null, fresh = false;
  const fmt = n => String(parseFloat(n.toPrecision(12)));
  const calc = (a, b, o) => ({ '+': a + b, '-': a - b, '×': a * b, '÷': a / b })[o];
  const run = () => {
    const r = calc(prev, parseFloat(cur), op);
    if (!isFinite(r)) { cur = 'Error'; prev = op = null; fresh = true; return false; }
    cur = fmt(r); return true;
  };
  const show = () => { d.textContent = cur; h.textContent = prev !== null ? fmt(prev) + ' ' + (op || '') : ''; };
  const keys = 'C ⌫ % ÷ 7 8 9 × 4 5 6 - 1 2 3 + ± 0 . ='.split(' ');
  $('.keys').innerHTML = keys.map(k => `<button class="${'÷×-+='.includes(k) ? 'op' : /[\d.]/.test(k) ? '' : 'fn'}" data-k="${k}">${k}</button>`).join('');
  $('.keys').onclick = e => {
    const k = e.target.dataset.k;
    if (!k) return;
    if (cur === 'Error' && !/[\d.C]/.test(k)) return;
    if (/\d/.test(k)) { cur = (cur === '0' || fresh) ? k : cur + k; fresh = false; }
    else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
    else if (k === 'C') { cur = '0'; prev = op = null; fresh = false; }
    else if (k === '⌫') { cur = (cur.length > 1 && !fresh) ? cur.slice(0, -1) : '0'; if (cur === '-') cur = '0'; }
    else if (k === '±') { cur = cur.startsWith('-') ? cur.slice(1) : (cur === '0' ? cur : '-' + cur); }
    else if (k === '%') { cur = fmt(parseFloat(cur) / 100); fresh = true; }
    else if (k === '=') { if (op && run()) { prev = op = null; fresh = true; } }
    else { if (op && !fresh && !run()) return show(); prev = parseFloat(cur); op = k; fresh = true; }
    show();
  };
}

function pct() {
  document.querySelectorAll('form[data-m]').forEach(f => f.onsubmit = e => {
    e.preventDefault();
    const a = val(f, 'a'), b = val(f, 'b'), m = f.dataset.m;
    if (isNaN(a) || isNaN(b)) return res(0, 'Please fill in both numbers.', f);
    if (m === 'of') return res([['Result', fix(a / 100 * b, 6)]], 0, f);
    if (m === 'is') { if (b === 0) return res(0, 'The total cannot be zero.', f); return res([['Result', fix(a / b * 100, 4) + '%']], 0, f); }
    if (a === 0) return res(0, 'The old value cannot be zero.', f);
    const c = (b - a) / Math.abs(a) * 100;
    res([[c >= 0 ? 'Increase' : 'Decrease', fix(Math.abs(c), 4) + '%', c >= 0 ? 'pos' : 'neg'], ['Difference', fix(b - a, 6)]], 0, f);
  });
}

function age() {
  const f = $('form'), t = new Date();
  const P = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  f.to.value = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  f.onsubmit = e => {
    e.preventDefault();
    if (!f.dob.value || !f.to.value) return res(0, 'Please choose both dates.');
    const a = P(f.dob.value), b = P(f.to.value);
    if (b < a) return res(0, 'The birth date must be before the "age at" date.');
    let y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
    if (d < 0) { m--; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); d = Math.max(d, 0); }
    if (m < 0) { y--; m += 12; }
    const days = Math.round((b - a) / 864e5);
    const n = new Date(b.getFullYear(), a.getMonth(), a.getDate());
    if (n < b) n.setFullYear(n.getFullYear() + 1);
    const left = Math.round((n - b) / 864e5);
    res([['Age', `${y} years, ${m} months, ${d} days`], ['Total months', fix(y * 12 + m)], ['Total weeks', fix(Math.floor(days / 7))], ['Total days', fix(days)], ['Next birthday', left === 0 ? 'Today! 🎉' : 'in ' + left + ' days']]);
  };
}

function bmi() {
  const f = $('form'), u = f.elements.unit;
  const lab = () => { const m = u.value === 'm'; $('#l1').textContent = m ? 'Weight (kg)' : 'Weight (lb)'; $('#l2').textContent = m ? 'Height (cm)' : 'Height (inches)'; };
  u.onchange = lab; lab();
  f.onsubmit = e => {
    e.preventDefault();
    const m = u.value === 'm', w = val(f, 'w'), h = val(f, 'h');
    if (!(w > 0 && h > 0)) return res(0, 'Enter a weight and height greater than zero.');
    const hm = m ? h / 100 : h * 0.0254, kg = m ? w : w * 0.45359237, b = kg / (hm * hm);
    const [c, cl] = b < 18.5 ? ['Underweight', 'neg'] : b < 25 ? ['Normal weight', 'pos'] : b < 30 ? ['Overweight', 'neg'] : ['Obese', 'neg'];
    const k = m ? 1 : 2.20462262, un = m ? ' kg' : ' lb';
    res([['Your BMI', fix(b, 1)], ['Category', c, cl], ['Healthy weight range', fix(18.5 * hm * hm * k, 1) + ' – ' + fix(24.9 * hm * hm * k, 1) + un]]);
  };
}

function discount() {
  const f = $('form');
  f.onsubmit = e => {
    e.preventDefault();
    const p = val(f, 'p'), d = val(f, 'd'), x = f.x.value === '' ? 0 : val(f, 'x');
    if (!(p >= 0) || !(d >= 0 && d <= 100) || !(x >= 0 && x <= 100)) return res(0, 'Enter a valid price and discounts between 0 and 100.');
    const fin = p * (1 - d / 100) * (1 - x / 100), save = p - fin;
    res([['Final price', money(fin), 'pos'], ['You save', money(save)], ['Total discount', fix(p ? save / p * 100 : 0) + '%']]);
  };
}

function pl() {
  const f = $('form');
  f.onsubmit = e => {
    e.preventDefault();
    const c = val(f, 'c'), s = val(f, 's'), q = f.q.value === '' ? 1 : val(f, 'q');
    if (!(c >= 0 && s >= 0 && q > 0)) return res(0, 'Enter cost and selling price (0 or more) and a quantity above zero.');
    const t = (s - c) * q;
    res([[t > 0 ? 'Profit' : t < 0 ? 'Loss' : 'Break-even', money(Math.abs(t)), t > 0 ? 'pos' : t < 0 ? 'neg' : ''], ['Total cost', money(c * q)], ['Total revenue', money(s * q)], ['Profit/loss % (on cost)', c > 0 ? fix((s - c) / c * 100) + '%' : '—'], ['Margin (on sales)', s > 0 ? fix((s - c) / s * 100) + '%' : '—']]);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  layout(); theme(); inputs();
  ({ home, standard: std, age, bmi, percentage: pct, discount, 'profit-loss': pl })[document.body.dataset.page]?.();
});