/* ==========================================================================
   Blackmore Entertainment: site script
   ========================================================================== */

// Same Google Form script the /plan page uses. Contact-page inquiries are
// emailed to you (they are NOT saved as wedding-form responses).
const SUBMIT_URL = "https://script.google.com/macros/s/AKfycbxv9eqatRNCso65fRbVTGnKkCP89Kq7AESNJrmZ_9FEgXk5vamqemY7u5cwXECHMWFEJw/exec";

// Your DJ setups, in order. Used by the showcase on Home, Weddings and Events.
const PACKAGES = [
  { id: "core", name: "Core", tier: "The Experience", image: "/assets/core.jpg",
    short: "A clean, professional table setup with black linens and speaker scrims.",
    desc: "A clean, professional DJ setup focused on what matters most: great music and a packed dance floor. Featuring a streamlined table setup with black linens, speaker scrims, and professional DJ equipment." },
  { id: "select", name: "Select", tier: "The Experience", image: "/assets/select.jpg",
    short: "A sleek, backlit DJ booth and dance floor lighting, in black or white.",
    desc: "Take your setup up a notch with a sleek, backlit DJ booth and dance floor lighting. Customize your look with your choice of black or white booth and speaker scrims. It's a more polished setup that brings a little extra atmosphere to the room." },
  { id: "pro", name: "Pro", tier: "The Experience", image: "/assets/pro.jpg",
    short: "Everything in Select, plus professional subwoofers for deep, full bass.",
    desc: "Everything in Select, with one major addition: serious low-end power. Professional subwoofers deliver the deep, full-bodied bass that brings your favorite dance tracks to life. Perfect for a crowd that wants to really feel the music." },
  { id: "elite", name: "Elite", tier: "The Experience", image: "/assets/elite.jpg",
    short: "Everything in Pro, plus intelligent lighting and moving heads.",
    desc: "Everything in Pro, amplified with additional intelligent lighting and moving heads. Dynamic beams, movement, and club-inspired lighting effects transform your dance floor into an immersive party experience. For any event that deserves a little more nightlife energy." },
  { id: "signature", name: "Signature Production", tier: "Our Largest Presentation", image: "/assets/signature.jpg",
    short: "An oversized booth with a front-facing display for your monogram, logo or photos.",
    desc: "Our largest and most customizable DJ presentation. Featuring an upgraded oversized DJ booth with an integrated front-facing display, perfect for showcasing a wedding monogram, company logo, photos, videos and special moments. A personalized visual centerpiece that makes your entertainment setup part of the overall event design." },
];

document.documentElement.classList.remove("no-js");

/* ---------- Header: solid on scroll, mobile menu ---------- */
(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  const toggle = header.querySelector(".menu-toggle");
  toggle && toggle.addEventListener("click", () => {
    const open = header.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  header.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", () => {
    header.classList.remove("open"); document.body.style.overflow = "";
  }));
})();

/* ---------- Footer year ---------- */
document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

/* ---------- Fade sections in as they scroll into view ---------- */
(function () {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  els.forEach(e => io.observe(e));
})();

/* ---------- Package showcase: hover (or tap) swaps the big photo ---------- */
// <div data-showcase data-link="/contact/?package={id}"></div>
document.querySelectorAll("[data-showcase]").forEach(root => {
  const linkTpl = root.dataset.link || "";
  root.classList.add("packages");
  root.innerHTML = `
    <div class="stage" aria-live="polite">
      <div class="stage-caption"><div class="tier"></div><div class="name"></div><p class="desc"></p></div>
    </div>
    <div>
      <div class="pkg-list"></div>
      ${root.dataset.note ? `<p class="pkg-note">${root.dataset.note}</p>` : ""}
    </div>`;
  const stage = root.querySelector(".stage");
  const list = root.querySelector(".pkg-list");
  const cap = { tier: stage.querySelector(".tier"), name: stage.querySelector(".name"), desc: stage.querySelector(".desc") };
  const imgs = {};

  PACKAGES.forEach((p, i) => {
    const img = new Image();
    img.src = p.image; img.alt = p.name + " DJ setup"; img.loading = i === 0 ? "eager" : "lazy";
    stage.insertBefore(img, stage.firstChild);
    imgs[p.id] = img;

    const el = document.createElement(linkTpl ? "a" : "div");
    el.className = "pkg";
    el.dataset.id = p.id;
    if (linkTpl) el.href = linkTpl.replace("{id}", p.id);
    el.innerHTML = `
      <img class="pkg-thumb" src="${p.image}" alt="" loading="lazy">
      <div><p class="pkg-name">${p.name}</p><p class="pkg-desc short">${p.short}</p><p class="pkg-desc full">${p.desc}</p></div>
      <span class="pkg-arrow" aria-hidden="true">&rarr;</span>`;
    list.appendChild(el);
  });

  let current = null;
  const show = id => {
    const p = PACKAGES.find(x => x.id === id);
    if (!p || current === id) return;
    current = id;
    Object.entries(imgs).forEach(([k, el]) => el.classList.toggle("show", k === id));
    list.querySelectorAll(".pkg").forEach(el => el.classList.toggle("active", el.dataset.id === id));
    cap.tier.textContent = p.tier; cap.name.textContent = p.name; cap.desc.textContent = p.desc;
  };
  list.querySelectorAll(".pkg").forEach(el => {
    el.addEventListener("mouseenter", () => show(el.dataset.id));
    el.addEventListener("focus", () => show(el.dataset.id));
    // On touch screens the first tap previews; a second tap follows the link
    el.addEventListener("click", e => {
      if (window.matchMedia("(hover: none)").matches && current !== el.dataset.id) { e.preventDefault(); show(el.dataset.id); }
    });
  });
  show(PACKAGES[0].id);
});

/* ---------- Contact / inquiry form ---------- */
(function () {
  const form = document.getElementById("inquiryForm");
  if (!form) return;
  const errorEl = form.querySelector(".form-error");
  const btn = form.querySelector("button[type=submit]");

  // Prefill from links like /contact/?type=Wedding&package=pro
  const q = new URLSearchParams(location.search);
  const pkg = PACKAGES.find(p => p.id === q.get("package"));
  const type = q.get("type") || "";
  if (type) form.querySelectorAll('input[name="Event Type"]').forEach(r => r.checked = r.value === type);
  if (pkg) form.querySelector('[name="Package Interest"]').value = pkg.name;
  const syncPackage = () => {
    const t = form.querySelector('input[name="Event Type"]:checked');
    form.querySelector("#packageWrap").hidden = !!t && ["Foam party", "Recording"].includes(t.value);
  };
  form.querySelectorAll('input[name="Event Type"]').forEach(r => r.addEventListener("change", syncPackage));
  syncPackage();

  form.addEventListener("submit", async e => {
    e.preventDefault();
    form.classList.add("touched");
    const bad = [...form.elements].find(f => f.willValidate && !f.checkValidity());
    if (bad) { errorEl.textContent = "Please fill in the highlighted fields."; bad.focus(); return; }
    errorEl.textContent = "";

    const data = new URLSearchParams();
    data.append("formType", "inquiry");
    for (const [k, v] of new FormData(form).entries()) if (String(v).trim()) data.append(k, v);
    if (form.querySelector("#packageWrap").hidden) data.delete("Package Interest");

    btn.disabled = true; btn.textContent = "Sending…";
    try {
      let result = null;
      try { result = await (await fetch(SUBMIT_URL, { method: "POST", body: data })).json(); } catch (_) { result = null; }
      if (result && result.ok === false) throw new Error(result.error);
      form.hidden = true;
      document.getElementById("inquirySuccess").hidden = false;
    } catch (err) {
      console.error(err);
      errorEl.textContent = "Something went wrong. Please try again, or call or email us directly.";
    } finally {
      btn.disabled = false; btn.textContent = "Send inquiry";
    }
  });
})();
