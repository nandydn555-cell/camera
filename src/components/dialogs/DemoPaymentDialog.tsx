import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../state/StoreContext';
import { money } from '../../utils/format';

export default function DemoPaymentDialog() {
  const { demoPayment, busy, completeDemoPayment, dismissDemoPayment } = useStore();
  const navigate = useNavigate();
  if (!demoPayment) return null;

  const markComplete = async () => {
    try {
      await completeDemoPayment();
      navigate('/orders');
    } catch {
      // The provider reports the payment update error in the global toast.
    }
  };

  const payLater = () => {
    if (busy) return;
    dismissDemoPayment();
    navigate('/orders');
  };

  return (
    <div className="modal-backdrop" onClick={payLater}>
      <section className="modal payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={payLater} aria-label="Pay later">×</button>
        <span className="eyebrow">DEMO PAYMENT</span>
        <h2 id="payment-title">Scan the demo QR</h2>
        <p className="payment-warning">Энэ QR нь туршилтынх. Банк эсвэл QPay төлбөр хийхгүй.</p>
        <img className="payment-qr" src={demoPayment.qrDataUrl} alt="Demo QR code. It does not accept payment." />
        <p><b>Order:</b> {demoPayment.orderId.slice(0, 8)} · <b>Total:</b> {money(demoPayment.amount)}</p>
        <p className="payment-hint">Доорх товч нь зөвхөн demo төлбөрийг бүртгэнэ. Бодит төлбөр баталгаажуулахгүй.</p>
        <button className="button dark-button full" disabled={busy} onClick={() => void markComplete()}>{busy ? 'Updating…' : 'Mark demo payment complete'} <Check size={16} /></button>
        <button className="text-link payment-later" disabled={busy} onClick={payLater}>Pay later</button>
      </section>
    </div>
  );
}
