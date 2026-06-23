import React, { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, Smartphone, Building, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import type { PlanTier } from '../App';

interface PaymentPageProps {
  plan: PlanTier | null;
  onBack: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'upi' | 'card' | 'netbanking';

export default function PaymentPage({ plan, onBack, onSuccess }: PaymentPageProps) {
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  const displayPlan = plan || { name: 'Pro Tier', price: 500, interval: 'month' };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'upi' && !upiId) {
      toast.error('Please enter a valid UPI ID');
      return;
    }
    if (method === 'card' && (!cardNumber || !cardExpiry || !cardCvv || !cardName)) {
      toast.error('Please fill in all card details');
      return;
    }
    if (method === 'netbanking' && !selectedBank) {
      toast.error('Please select a bank');
      return;
    }

    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast.success('Payment successful! Welcome to ' + displayPlan.name);
      
      // Redirect after showing success state
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2000);
  };

  const banks = [
    { id: 'sbi', name: 'State Bank of India', logo: 'S' },
    { id: 'hdfc', name: 'HDFC Bank', logo: 'H' },
    { id: 'icici', name: 'ICICI Bank', logo: 'I' },
    { id: 'axis', name: 'Axis Bank', logo: 'A' },
  ];

  if (isSuccess) {
    return (
      <div className="payment-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--c-surface)' }}>
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
          <CheckCircle2 size={80} color="var(--c-emerald)" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--c-text)', marginBottom: 12 }}>Payment Successful</h2>
          <p style={{ fontSize: 16, color: 'var(--c-muted)' }}>Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-header">
        <button onClick={onBack} className="back-btn" aria-label="Go back">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="secure-badge">
          <ShieldCheck size={16} /> Secure Checkout
        </div>
      </div>

      <div className="payment-container">
        {/* Left: Payment Form */}
        <div className="payment-form-section">
          <h1 className="payment-title">Complete your payment</h1>
          <p className="payment-subtitle">Choose your preferred payment method</p>

          <div className="payment-methods">
            <button 
              type="button" 
              className={`method-tab ${method === 'upi' ? 'active' : ''}`}
              onClick={() => setMethod('upi')}
            >
              <Smartphone size={20} /> UPI
            </button>
            <button 
              type="button" 
              className={`method-tab ${method === 'card' ? 'active' : ''}`}
              onClick={() => setMethod('card')}
            >
              <CreditCard size={20} /> Card
            </button>
            <button 
              type="button" 
              className={`method-tab ${method === 'netbanking' ? 'active' : ''}`}
              onClick={() => setMethod('netbanking')}
            >
              <Building size={20} /> Net Banking
            </button>
          </div>

          <form onSubmit={handlePay} className="payment-form">
            {/* UPI Form */}
            {method === 'upi' && (
              <div className="form-group animate-fade-in">
                <label>UPI ID / VPA</label>
                <div className="input-wrap">
                  <input 
                    type="text" 
                    placeholder="example@okaxis" 
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                  <span className="input-icon">@</span>
                </div>
                <p className="form-hint">A payment request will be sent to your UPI app.</p>
              </div>
            )}

            {/* Card Form */}
            {method === 'card' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-group">
                  <label>Card Number</label>
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000" 
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\W/gi, '').replace(/(.{4})/g, '$1 ').trim())}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Expiry (MM/YY)</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input 
                      type="password" 
                      placeholder="123" 
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Net Banking Form */}
            {method === 'netbanking' && (
              <div className="form-group animate-fade-in">
                <label>Select your bank</label>
                <div className="bank-grid">
                  {banks.map(bank => (
                    <button 
                      key={bank.id} 
                      type="button"
                      className={`bank-btn ${selectedBank === bank.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBank(bank.id)}
                    >
                      <div className="bank-logo">{bank.logo}</div>
                      <span>{bank.name}</span>
                    </button>
                  ))}
                </div>
                <div className="form-group" style={{ marginTop: 20 }}>
                  <select 
                    className="bank-select"
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                  >
                    <option value="">Or select other bank</option>
                    <option value="kotak">Kotak Mahindra Bank</option>
                    <option value="yes">YES Bank</option>
                    <option value="pnb">Punjab National Bank</option>
                    <option value="bob">Bank of Baroda</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="pay-btn"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><Loader2 size={18} className="animate-spin" /> Processing...</>
              ) : (
                `Pay ₹${displayPlan.price}`
              )}
            </button>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="order-summary-section">
          <div className="summary-card">
            <h3>Order Summary</h3>
            
            <div className="summary-item">
              <div>
                <h4>{displayPlan.name}</h4>
                <p>Billed per {displayPlan.interval}</p>
              </div>
              <div className="item-price">₹{displayPlan.price}</div>
            </div>

            <div className="summary-divider" />

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{displayPlan.price}</span>
            </div>
            <div className="summary-row">
              <span>Tax (18% GST)</span>
              <span>₹{Math.round(displayPlan.price * 0.18)}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total amount</span>
              <span>₹{displayPlan.price + Math.round(displayPlan.price * 0.18)}</span>
            </div>

            <div className="guarantee">
              <ShieldCheck size={18} />
              <span>100% secure payment with 256-bit encryption.</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .payment-page {
          min-height: 100vh;
          background: var(--c-surface-alt, #FAFAF8);
          font-family: 'Inter', sans-serif;
        }

        .payment-header {
          padding: 24px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--c-surface);
          border-bottom: 1px solid var(--c-border);
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          font-size: 15px;
          font-weight: 600;
          color: var(--c-muted);
          cursor: pointer;
          transition: color 0.2s;
        }
        .back-btn:hover {
          color: var(--c-text);
        }

        .secure-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--c-emerald);
          background: var(--c-emerald-lt);
          padding: 6px 12px;
          border-radius: 20px;
        }

        .payment-container {
          max-width: 1000px;
          margin: 40px auto;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
          padding: 0 24px;
        }

        @media (max-width: 800px) {
          .payment-container {
            grid-template-columns: 1fr;
          }
          .order-summary-section {
            order: -1;
          }
        }

        .payment-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--c-text);
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }

        .payment-subtitle {
          font-size: 15px;
          color: var(--c-muted);
          margin: 0 0 32px;
        }

        .payment-methods {
          display: flex;
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 10px;
          padding: 6px;
          margin-bottom: 32px;
        }

        .method-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          color: var(--c-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .method-tab:hover {
          color: var(--c-text);
        }
        .method-tab.active {
          background: var(--c-navy);
          color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .payment-form {
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        [data-theme="dark"] .payment-form {
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--c-text);
        }

        .form-group input, .bank-select {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid var(--c-border);
          border-radius: 8px;
          background: var(--c-surface-alt);
          color: var(--c-text);
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-group input:focus, .bank-select:focus {
          outline: none;
          border-color: var(--c-emerald);
          box-shadow: 0 0 0 3px var(--c-emerald-lt);
        }

        .input-wrap {
          position: relative;
        }
        .input-wrap input {
          padding-left: 40px;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--c-muted);
          font-weight: 600;
          font-size: 16px;
        }

        .form-hint {
          font-size: 12px;
          color: var(--c-muted);
          margin: 4px 0 0;
        }

        .bank-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .bank-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--c-border);
          border-radius: 8px;
          background: var(--c-surface);
          color: var(--c-text);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .bank-btn:hover {
          border-color: var(--c-text-muted);
        }
        .bank-btn.selected {
          border-color: var(--c-emerald);
          background: var(--c-emerald-lt);
        }
        
        .bank-logo {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: var(--c-navy);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .pay-btn {
          margin-top: 32px;
          width: 100%;
          padding: 16px;
          background: var(--c-emerald);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s;
        }
        .pay-btn:hover:not(:disabled) {
          background: #047857; /* darker emerald */
        }
        .pay-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .summary-card {
          background: var(--c-surface);
          border: 1px solid var(--c-border);
          border-radius: 12px;
          padding: 32px;
          position: sticky;
          top: 100px;
        }

        .summary-card h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--c-text);
          margin: 0 0 24px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .summary-item h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--c-text);
          margin: 0 0 4px;
        }
        .summary-item p {
          font-size: 13px;
          color: var(--c-muted);
          margin: 0;
        }
        .item-price {
          font-size: 16px;
          font-weight: 700;
          color: var(--c-text);
        }

        .summary-divider {
          height: 1px;
          background: var(--c-border);
          margin: 20px 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: var(--c-text-muted);
          margin-bottom: 12px;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 18px;
          font-weight: 800;
          color: var(--c-text);
          margin-bottom: 24px;
        }

        .guarantee {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--c-muted);
          background: var(--c-surface-alt);
          padding: 12px;
          border-radius: 8px;
          border: 1px dashed var(--c-border);
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
