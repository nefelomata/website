// Everything here is an enhancement. The site reads, navigates and downloads the CV without it.

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [
  ...root.querySelectorAll<T>(sel),
];
const pad = (n: number) => String(n).padStart(2, '0');

/* White balance = house lights. 3200K (night, the default) or 5600K (daylight). */
function houseLights() {
  const btn = $<HTMLButtonElement>('[data-lights]');
  if (!btn) return;
  const root = document.documentElement;
  const themeColor = $<HTMLMetaElement>('meta[name="theme-color"]');

  const sync = () => {
    const up = root.dataset.theme === 'light';
    btn.setAttribute('aria-pressed', String(up));
    btn.title = up ? 'White balance 5600K: house lights up' : 'White balance 3200K: house lights down';
    themeColor?.setAttribute('content', up ? '#f5f3fa' : '#0b0a10');
  };

  btn.hidden = false;
  sync();
  btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem('nk-lights', root.dataset.theme);
    } catch {
      /* private mode: the choice just won't stick */
    }
    sync();
  });
}

/* Timecode in the HUD, and how long you've been on the page in the footer. */
function timecode() {
  const codes = $$('[data-timecode]');
  const runtimes = $$('[data-runtime]');
  const start = performance.now();
  const hms = (s: number) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;

  runtimes.forEach((el) => el.closest<HTMLElement>('[hidden]')?.removeAttribute('hidden'));
  setInterval(() => {
    const s = Math.floor((performance.now() - start) / 1000);
    runtimes.forEach((el) => (el.textContent = hms(s)));
  }, 1000);

  if (!codes.length) return;
  let last = '';
  const frame = (now: number) => {
    const t = (now - start) / 1000;
    const ff = reduceMotion ? '00' : pad(Math.floor((t % 1) * 24));
    const text = `${hms(Math.floor(t))}:${ff}`;
    if (text !== last) {
      last = text;
      codes.forEach((el) => (el.textContent = text));
    }
    if (reduceMotion) setTimeout(() => frame(performance.now()), 1000);
    else requestAnimationFrame(frame);
  };
  frame(start);
}

/* The autofocus box in the portrait follows you around and judges what you're pointing at. */
function autofocus() {
  const frame = $('.vf-frame');
  const af = $('[data-af]');
  const label = $('[data-af-label]');
  if (!frame || !af || !label) return;

  const FACE = { x0: 0.28, x1: 0.8, y0: 0.14, y1: 0.62 };
  const clamp = (v: number) => Math.min(0.85, Math.max(0.15, v));

  const aim = (e: PointerEvent) => {
    const r = frame.getBoundingClientRect();
    const x = clamp((e.clientX - r.left) / r.width);
    const y = clamp((e.clientY - r.top) / r.height);
    // The focus box and the depth-of-field mask both read these.
    frame.style.setProperty('--af-x', `${x * 100}%`);
    frame.style.setProperty('--af-y', `${y * 100}%`);
    const onFace = x > FACE.x0 && x < FACE.x1 && y > FACE.y0 && y < FACE.y1;
    af.classList.toggle('searching', !onFace);
    label.textContent = onFace ? 'Subject: Nefeli' : y > 0.68 ? 'Subject: hoodie?' : 'Subject: trees?';
  };

  const reset = () => {
    frame.style.removeProperty('--af-x');
    frame.style.removeProperty('--af-y');
    af.classList.remove('searching');
    label.textContent = 'AF · face';
  };

  frame.addEventListener('pointermove', aim);
  frame.addEventListener('pointerdown', aim);
  frame.addEventListener('pointerleave', reset);
}

/* Fade sections in as they enter the frame. The inline script in <head> already hid them. */
function reveals() {
  const items = $$('.reveal');
  if (!items.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).style.setProperty('--i', String(i++));
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.1 },
  );
  items.forEach((el) => io.observe(el));
}

/* About: the paragraph lights up word by word as you scroll through it. */
function manifesto() {
  const el = $('[data-words]');
  if (!el || reduceMotion) return;
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();

  const spoken = document.createElement('span');
  spoken.className = 'visually-hidden';
  spoken.textContent = text;
  const shown = document.createElement('span');
  shown.setAttribute('aria-hidden', 'true');
  const words = text.split(' ').map((w) => {
    const s = document.createElement('span');
    s.className = 'w';
    s.textContent = `${w} `;
    shown.append(s);
    return s;
  });
  el.replaceChildren(spoken, shown);

  let lit = -1;
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = el.getBoundingClientRect();
    const vh = innerHeight;
    const progress = Math.min(1, Math.max(0, (vh * 0.82 - r.top) / (r.height + vh * 0.3)));
    const n = Math.round(progress * words.length);
    if (n === lit) return;
    lit = n;
    words.forEach((w, i) => w.classList.toggle('lit', i < n));
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) addEventListener('scroll', onScroll, { passive: true });
    else removeEventListener('scroll', onScroll);
    update();
  }).observe(el);
}

/* The HUD's scene label (bottom left) and the current section in the nav. */
function scenes() {
  const box = $('.hud-scene');
  const num = $('[data-scene-n]');
  const label = $('[data-scene-label]');
  const sections = $$('[data-scene]');
  if (!box || !num || !label || !sections.length) return;

  const links = $$<HTMLAnchorElement>('.hud-nav a');
  const show = (target: HTMLElement) => {
    const [n, name] = (target.dataset.scene ?? '').split('|');
    num.textContent = n;
    label.textContent = name ?? '';
    links.forEach((a) => {
      if (target.id && a.hash === `#${target.id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  show(sections[0]);
  box.hidden = false;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) show(e.target as HTMLElement);
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}

/* Scroll-linked bits, one rAF per frame: the focus-distance needle in the HUD, and the clouds. */
function scrollLinked() {
  const root = document.documentElement;
  const skies = $$('[data-sky]');
  const visible = new Set<HTMLElement>();
  const smooth = (a: number, b: number, v: number) => {
    const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    const max = root.scrollHeight - innerHeight;
    root.style.setProperty('--focus', (max > 0 ? scrollY / max : 0).toFixed(4));
    if (reduceMotion) return;
    for (const sky of visible) {
      const r = sky.getBoundingClientRect();
      if (sky.classList.contains('cold-open')) {
        // How far the middle of the section is below the middle of the screen, in screen heights.
        // The clouds are shut while it's on its way up and fully open once it's centred.
        const below = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        sky.style.setProperty('--part', (1 - smooth(0.05, 0.75, below)).toFixed(4));
      } else {
        const p = (innerHeight - r.top) / (innerHeight + r.height);
        sky.style.setProperty('--rise', smooth(0.02, 0.5, p).toFixed(4));
      }
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target as HTMLElement);
      else visible.delete(e.target as HTMLElement);
    }
    onScroll();
  });
  skies.forEach((s) => io.observe(s));
  if (!reduceMotion) {
    // Start with the clouds closed; they open as the section scrolls in.
    skies.forEach((s) => s.style.setProperty(s.classList.contains('cold-open') ? '--part' : '--rise', '0'));
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();
}

/* AF brackets snap onto the key words once they reach the middle of the screen. */
function focusLock() {
  const words = $$('.af');
  if (!words.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('locked');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '-25% 0px -25% 0px' },
  );
  words.forEach((w) => io.observe(w));
}

function flash() {
  if (reduceMotion) return;
  const f = document.createElement('div');
  f.className = 'flash';
  f.setAttribute('aria-hidden', 'true');
  f.addEventListener('animationend', () => f.remove());
  document.body.append(f);
}

/* The clapperboard is a real download link; this just adds the slam, the flash and the take count. */
function clapper() {
  const board = $<HTMLAnchorElement>('[data-clapper]');
  if (!board) return;
  const takeEl = $('[data-take]', board);
  const msg = $('[data-clapper-msg]');
  const credits = $('[data-credits]');
  const date = $('[data-clap-date]', board);
  if (date) {
    const d = new Date();
    date.textContent = [d.getDate(), d.getMonth() + 1, d.getFullYear() % 100].map(pad).join('.');
  }
  const LINES = [
    "Cut. That's a wrap.",
    'One more for safety.',
    'Okay, you really like it.',
    'At this point we should just talk.',
  ];
  let take = 1;
  let reopen = 0;

  board.addEventListener('click', () => {
    board.classList.remove('slam');
    void board.offsetWidth;
    board.classList.add('slam');
    clearTimeout(reopen);
    reopen = window.setTimeout(() => board.classList.remove('slam'), 1600);
    flash();
    if (msg) msg.textContent = `Take ${take}. ${LINES[Math.min(take - 1, LINES.length - 1)]} Your CV is on its way.`;
    take += 1;
    if (takeEl) takeEl.textContent = String(take);
    if (credits) {
      credits.classList.remove('on');
      void credits.offsetWidth;
      credits.classList.add('on');
    }
  });
}

/* The call sheet: pick a scene, a day and a call time, and it writes the email for you. */
function callSheet() {
  const form = $<HTMLFormElement>('[data-callsheet]');
  if (!form) return;
  const email = form.dataset.email ?? '';
  const daysBox = $('[data-cs-days]', form);
  const summary = $('[data-cs-summary]', form);
  const send = $<HTMLButtonElement>('.cs-send', form);
  if (!daysBox || !summary || !send) return;

  // The next six weekdays.
  const days: Date[] = [];
  const d = new Date();
  while (days.length < 6) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() % 6 !== 0) days.push(new Date(d));
  }
  const short = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const long = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  for (const [i, day] of days.entries()) {
    const label = document.createElement('label');
    label.className = 'cs-chip';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'day';
    input.value = String(i);
    const span = document.createElement('span');
    span.textContent = short.format(day);
    label.append(input, span);
    daysBox.append(label);
  }
  form.hidden = false;

  const read = () => {
    const data = new FormData(form);
    const day = data.get('day');
    const time = data.get('time');
    const kind = data.get('kind') === 'call' ? 'call' : 'coffee';
    return { day: day === null ? null : days[Number(day)], time: time as string | null, kind };
  };

  form.addEventListener('change', () => {
    const { day, time, kind } = read();
    const ok = Boolean(day && time);
    send.disabled = !ok;
    summary.classList.toggle('ok', ok);
    summary.textContent =
      day && time
        ? `Call time: ${short.format(day)}, ${time}, Athens time. ${kind === 'coffee' ? 'I’ll suggest a spot.' : 'I’ll send the link.'}`
        : 'Pick a day and a call time.';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { day, time, kind } = read();
    if (!day || !time) return;
    const what = kind === 'coffee' ? 'a coffee in Athens' : 'a video call';
    const subject = `Call sheet: ${kind === 'coffee' ? 'coffee' : 'video call'} on ${short.format(day)}`;
    const body = `Hi Nefeli,\n\nI'd like to book ${what} on ${long.format(day)} at ${time} (Athens time).\n\nAbout me / the project:\n\n`;
    location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

/* Viewfinder cursor: corner brackets that trail the pointer and say what a click will do. */
function cursor() {
  const cur = $('.cursor');
  const label = $('.cursor-label');
  if (!cur || !label || !finePointer || reduceMotion) return;

  let x = -100;
  let y = -100;
  let cx = x;
  let cy = y;
  let raf = 0;

  const loop = () => {
    cx += (x - cx) * 0.24;
    cy += (y - cy) * 0.24;
    cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.2 ? requestAnimationFrame(loop) : 0;
  };

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      cur.classList.add('on');
      if (!raf) raf = requestAnimationFrame(loop);
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => cur.classList.remove('on'));

  document.addEventListener('pointerover', (e) => {
    const target = (e.target as Element).closest('[data-cursor], a, button, summary, label');
    const text = target?.getAttribute('data-cursor') ?? '';
    label.textContent = text;
    cur.classList.toggle('has-label', Boolean(text));
    cur.classList.toggle('is-link', Boolean(target));
  });
}

function hello() {
  console.log(
    "%cNefeli Koumantaki%c\nReading the source? Bold. I like that in a collaborator.\nnefelikoumant@gmail.com",
    'font: 700 18px system-ui; color: #8f7bff',
    'font: 13px system-ui; line-height: 1.6',
  );
}

(window as typeof window & { __nk?: boolean }).__nk = true;
houseLights();
timecode();
autofocus();
reveals();
manifesto();
scenes();
scrollLinked();
focusLock();
clapper();
callSheet();
cursor();
hello();
