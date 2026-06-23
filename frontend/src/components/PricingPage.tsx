
import { ArrowLeft } from 'lucide-react';
import type { PlanTier } from '../App';

interface PricingPageProps {
  onBack: () => void;
  onSubscribe: (plan: PlanTier) => void;
}

export default function PricingPage({ onBack, onSubscribe }: PricingPageProps) {
  return (
    <div className="pricing-page" style={{ minHeight: "100vh", background: "var(--c-surface)" }}>
      <div className="pricing-header-bar" style={{ padding: "24px 40px", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center" }}>
        <button onClick={onBack} className="back-btn" aria-label="Go back" style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", fontSize: 15, fontWeight: 600, color: "var(--c-muted)", cursor: "pointer", transition: "color 0.2s" }}>
          <ArrowLeft size={20} /> Back to Home
        </button>
      </div>
      
      <section style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "var(--c-text)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: 18, color: "var(--c-muted)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
              Choose the plan that best fits your financial optimization needs. No hidden fees.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" }}>
            {/* Free Tier */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Basic Tier</h3>
                <div className="pricing-price">
                  <span className="currency">₹</span>0<span className="period">/month</span>
                </div>
                <p>For essential debt tracking</p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li><span className="material-symbols-outlined check">check_circle</span> Basic debt & wealth tracking</li>
                  <li><span className="material-symbols-outlined check">check_circle</span> Standard Avalanche optimization</li>
                  <li><span className="material-symbols-outlined check">check_circle</span> 1 AI Financial Agent</li>
                  <li className="disabled"><span className="material-symbols-outlined x">cancel</span> Historical data tracking</li>
                  <li className="disabled"><span className="material-symbols-outlined x">cancel</span> Tax optimization planner</li>
                </ul>
              </div>
              <button className="btn-outline pricing-btn" style={{ pointerEvents: "none" }}>Current Plan</button>
            </div>

            {/* Pro Tier (Popular) */}
            <div className="pricing-card popular">
              <div className="popular-badge">Most Popular</div>
              <div className="pricing-header">
                <h3>Pro Tier</h3>
                <div className="pricing-price">
                  <span className="currency">₹</span>500<span className="period">/month</span>
                </div>
                <p>For serious financial restructuring</p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li><span className="material-symbols-outlined check">check_circle</span> Advanced debt & wealth tracking</li>
                  <li><span className="material-symbols-outlined check">check_circle</span> Aggressive Avalanche optimization</li>
                  <li><span className="material-symbols-outlined check">check_circle</span> 3 Premium AI Financial Agents</li>
                  <li><span className="material-symbols-outlined check">check_circle</span> Full historical data tracking</li>
                  <li className="disabled"><span className="material-symbols-outlined x">cancel</span> Tax optimization planner</li>
                </ul>
              </div>
              <button 
                className="btn-primary pricing-btn"
                onClick={() => onSubscribe({ name: "Pro Tier", price: 500, interval: "month" })}
              >
                Subscribe Now
              </button>
            </div>

            {/* Elite Tier */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Elite Tier</h3>
                <div className="pricing-price">
                  <span className="currency">₹</span>1000<span className="period">/month</span>
                </div>
                <p>For total wealth management</p>
              </div>
              <div className="pricing-features">
                <ul>
                  <li><span className="material-symbols-outlined check">check_circle</span> Custom financial modeling</li>
                  <li><span className="material-symbols-outlined check">check_circle</span> Dynamic real-time optimization</li>
                  <li><span className="material-symbols-outlined check">check_circle</span> Unlimited AI Financial Agents</li>
                  <li><span className="material-symbols-outlined check">check_circle</span> Full historical data tracking</li>
                  <li><span className="material-symbols-outlined check">check_circle</span> Tax optimization planner</li>
                </ul>
              </div>
              <button 
                className="btn-primary pricing-btn"
                onClick={() => onSubscribe({ name: "Elite Tier", price: 1000, interval: "month" })}
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .back-btn:hover {
          color: var(--c-text) !important;
        }
        
        /* PRICING STYLES */
        .pricing-card {
          background: var(--c-surface-alt, #FAFAF8);
          border: 1px solid var(--c-border);
          border-radius: 16px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.06);
        }
        [data-theme="dark"] .pricing-card:hover {
          box-shadow: 0 12px 32px rgba(0,0,0,0.2);
        }
        .pricing-card.popular {
          border: 2px solid var(--c-emerald);
          box-shadow: 0 8px 24px rgba(5, 150, 105, 0.1);
        }
        [data-theme="dark"] .pricing-card.popular {
          box-shadow: 0 8px 24px rgba(5, 150, 105, 0.2);
        }
        .popular-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--c-emerald);
          color: white;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pricing-header {
          border-bottom: 1px solid var(--c-border);
          padding-bottom: 24px;
          margin-bottom: 24px;
        }
        .pricing-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: var(--c-text);
          margin: 0 0 12px;
        }
        .pricing-price {
          font-size: 48px;
          font-weight: 800;
          color: var(--c-navy);
          display: flex;
          align-items: baseline;
          margin-bottom: 8px;
          letter-spacing: -0.03em;
        }
        .pricing-price .currency {
          font-size: 24px;
          font-weight: 600;
          color: var(--c-muted);
          margin-right: 4px;
        }
        .pricing-price .period {
          font-size: 16px;
          font-weight: 500;
          color: var(--c-muted);
          margin-left: 4px;
        }
        .pricing-header p {
          font-size: 14px;
          color: var(--c-muted);
          margin: 0;
        }
        .pricing-features ul {
          list-style: none;
          padding: 0;
          margin: 0 0 32px;
        }
        .pricing-features li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          color: var(--c-text);
          margin-bottom: 16px;
        }
        .pricing-features li.disabled {
          color: var(--c-muted);
        }
        .pricing-features .check {
          color: var(--c-emerald);
          font-size: 20px;
        }
        .pricing-features .x {
          color: var(--c-muted);
          font-size: 20px;
          opacity: 0.5;
        }
        .pricing-btn {
          margin-top: auto;
          width: 100%;
          padding: 14px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
