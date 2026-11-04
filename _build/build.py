"""
Builds the site's pages from the page files in _build/pages/.
Each page file holds: a first line of JSON settings, then the page's HTML body.
Run:  python3 _build/build.py   (from the website folder)
"""
import json, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "_build" / "pages"
SITE = "https://www.blackmoreentertainment.com"

NAV = [
    ("Weddings", "/weddings/"),
    ("Events", "/events/"),
    ("Foam Parties", "/foam-parties/"),
    ("Services", "/services/"),
    ("About", "/about/"),
    ("Contact", "/contact/"),
]

def header(active):
    current = ' aria-current="page"'
    links = "\n".join(
        f'        <li><a href="{href}"{current if href == active else ""}>{name}</a></li>'
        for name, href in NAV
    )
    return f"""<header class="site-header">
  <nav class="nav" aria-label="Main">
    <a class="brand" href="/" aria-label="Blackmore Entertainment home">
      <img src="/assets/logo.webp" alt="" width="40" height="50">
      <span>Blackmore<br>Entertainment</span>
    </a>
    <ul class="nav-links">
{links}
        <li class="mobile-cta"><a href="/contact/">Check your date</a></li>
    </ul>
    <a class="btn nav-cta" href="/contact/">Check your date</a>
    <button class="menu-toggle" aria-label="Menu" aria-expanded="false"><span></span></button>
  </nav>
</header>"""

FOOTER = """<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="/assets/logo.webp" alt="Blackmore Entertainment">
        <p>DJ entertainment, lighting and event design for weddings, corporate events and parties of every kind.</p>
      </div>
      <div>
        <h4>Explore</h4>
        <ul>
          <li><a href="/weddings/">Weddings</a></li>
          <li><a href="/events/">Corporate &amp; Parties</a></li>
          <li><a href="/foam-parties/">Foam Parties</a></li>
          <li><a href="/services/">Services</a></li>
          <li><a href="/about/">About</a></li>
        </ul>
      </div>
      <div>
        <h4>Get in touch</h4>
        <ul>
          <li><a href="tel:+12032581349">(203) 258-1349</a></li>
          <li><a href="mailto:hello@blackmoreentertainment.com">hello@blackmoreentertainment.com</a></li>
          <li><a href="/contact/">Check your date</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year></span> Blackmore Entertainment</span>
      <span>Fairfield County, CT &middot; Westchester County, NY &middot; and beyond</span>
    </div>
  </div>
</footer>"""

def page(meta, body):
    title = meta["title"]
    full_title = "Blackmore Entertainment" if meta["path"] == "/" else f"{title} | Blackmore Entertainment"
    desc = html.escape(meta["description"], quote=True)
    image = SITE + meta.get("image", "/assets/signature.jpg")
    robots = '\n<meta name="robots" content="noindex, nofollow">' if meta.get("noindex") else ""
    return f"""<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{full_title}</title>
<meta name="description" content="{desc}">{robots}
<link rel="canonical" href="{SITE}{meta['path']}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Blackmore Entertainment">
<meta property="og:title" content="{full_title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{image}">
<meta property="og:url" content="{SITE}{meta['path']}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/logo.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css">
</head>
<body>
{header(meta['path'])}
<main>
{body.strip()}
</main>
{FOOTER}
<script src="/js/site.js"></script>
</body>
</html>
"""

def main():
    for src in sorted(PAGES.glob("*.html")):
        first, body = src.read_text().split("\n", 1)
        meta = json.loads(first)
        out = ROOT / meta["path"].strip("/") / "index.html" if meta["path"] != "/" else ROOT / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page(meta, body))
        print("built", out.relative_to(ROOT))

if __name__ == "__main__":
    main()
