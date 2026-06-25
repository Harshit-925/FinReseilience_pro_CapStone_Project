export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-surface)", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, paddingRight: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, color: "var(--c-text)" }}>
          <span className="material-symbols-outlined" style={{ color: "var(--c-emerald)", fontSize: 18 }}>account_balance</span>
          FinResilience Pro
        </div>
        <div style={{ fontSize: 13, color: "var(--c-muted)" }}>© 2026 FinResilience Pro. All rights reserved.</div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "Security", "Contact"].map(link => (
            <a key={link} href={`/${link.toLowerCase()}.html`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--c-muted)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--c-text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--c-muted)")}
            >{link}</a>
          ))}
          <a href="https://github.com/Harshit-925/FinReseilience_pro_CapStone_Project" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--c-muted)", textDecoration: "none", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--c-text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--c-muted)")}
          >GitHub</a>
        </div>
      </div>
    </footer>
  );
}
