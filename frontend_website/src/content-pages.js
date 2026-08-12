import "./content-pages.css";

const routes = [
  ["/how-it-works/", "How it works"],
  ["/use-cases/", "Use cases"],
  ["/resources/", "Resources"],
  ["/about/", "About"],
];

function normalizePath(pathname) {
  return pathname === "/" ? pathname : `${pathname.replace(/\/+$/, "")}/`;
}

function logoMarkup() {
  return `
    <span class="og-mark" aria-hidden="true">
      <i></i><i></i><i></i><i></i><i></i>
    </span>
  `;
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const current = normalizePath(window.location.pathname);
    const activeIndex = routes.findIndex(([href]) => href === current);
    this.innerHTML = `
      <nav class="morphic-navbar" aria-label="Primary navigation">
        <div class="morphic-glass">
          ${routes.map(([href, label], index) => {
            const classes = ["morphic-link"];
            if (index === activeIndex) classes.push("is-active");
            if (index === activeIndex - 1) classes.push("is-before-active");
            if (index === activeIndex + 1) classes.push("is-after-active");
            return `<a class="${classes.join(" ")}" href="${href}" ${index === activeIndex ? 'aria-current="page"' : ""}>${label}</a>`;
          }).join("")}
        </div>
      </nav>
    `;
  }
}

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="og-site-footer">
        <div class="og-footer-grid">
          <div class="og-footer-brand">
            <a class="og-brand" href="/">
              ${logoMarkup()}
              <span>OpenGraph <b>AI</b></span>
            </a>
            <p>Heterogeneous data into queryable knowledge graphs. Context for agents that need to reason.</p>
          </div>
          <div class="og-footer-column">
            <p>Product</p>
            <a href="/how-it-works/">How it works</a>
            <a href="/use-cases/">Use cases</a>
            <a href="/#playground">Interfaces</a>
          </div>
          <div class="og-footer-column">
            <p>Company</p>
            <a href="/about/">About</a>
            <a href="https://www.linkedin.com/company/opengraph-ai/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://opengraphai.io" target="_blank" rel="noopener noreferrer">Website</a>
          </div>
          <div class="og-footer-column">
            <p>Developers</p>
            <a href="/resources/">Resources</a>
            <a href="https://github.com/OpenGraphAI/opengraph-ai#readme" target="_blank" rel="noopener noreferrer">Documentation</a>
            <a href="https://github.com/OpenGraphAI/opengraph-ai" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
        <div class="og-footer-base">
          <span>OPEN SOURCE · APACHE 2.0</span>
          <span>© <span data-current-year></span> OpenGraph AI</span>
        </div>
      </footer>
    `;
    this.querySelector("[data-current-year]").textContent = String(new Date().getFullYear());
  }
}

class PageCta extends HTMLElement {
  connectedCallback() {
    const eyebrow = this.getAttribute("eyebrow") || "OpenGraph AI";
    const title = this.getAttribute("title") || "Build context your agent can reason over.";
    const body = this.getAttribute("body") || "Start with the open-source repository and turn your data into a queryable graph.";
    this.innerHTML = `
      <section class="og-cta" aria-labelledby="og-cta-title">
        <div>
          <p class="og-eyebrow og-eyebrow-light">${eyebrow}</p>
          <h2 id="og-cta-title">${title}</h2>
          <p>${body}</p>
        </div>
        <div class="og-cta-actions">
          <a class="og-button og-button-signal" href="https://github.com/OpenGraphAI/opengraph-ai" target="_blank" rel="noopener noreferrer">View on GitHub <span aria-hidden="true">↗</span></a>
          <a class="og-button og-button-ghost-light" href="/resources/">Explore resources</a>
        </div>
      </section>
    `;
  }
}

customElements.define("site-header", SiteHeader);
customElements.define("site-footer", SiteFooter);
customElements.define("page-cta", PageCta);

const contactForm = document.querySelector("[data-contact-form]");
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const message = String(data.get("message") || "").trim();
  const subject = encodeURIComponent(`OpenGraph AI — message from ${name}`);
  const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
  window.location.href = `mailto:hello@opengraphai.io?subject=${subject}&body=${body}`;
  const status = contactForm.querySelector("[data-contact-status]");
  if (status) status.textContent = "Draft opened in your mail app.";
});
