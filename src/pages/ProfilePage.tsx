import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut, UserRound, Package, Pencil } from 'lucide-react';
import { useStore } from '../state/StoreContext';

export default function ProfilePage() {
  const { user, profile, busy, updateProfile, signOut, setAuthMode, setAuthOpen } = useStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await updateProfile({ fullName: String(form.get('full_name')), phone: String(form.get('phone')) });
      setEditing(false);
    } catch {
      // The provider displays the update error in the global toast.
    }
  };

  if (!user) return <section className="section"><span className="eyebrow">YOUR ACCOUNT</span><h1>Account <em>details.</em></h1><div className="empty"><p>Sign in to view your profile and order history.</p><button className="button dark-button" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>Sign in</button></div></section>;

  const logout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch {
      // Keep the user on the account page when Supabase cannot sign out.
    }
  };

  return (
    <section className="section account-page">
      <span className="eyebrow">YOUR ACCOUNT</span><h1>Account <em>details.</em></h1>
      <p className="account-intro">Your details, orders and everything in between.</p>
      <div className="account-layout">
      <article className="account-panel">
        <header className="account-identity"><span className="account-avatar"><UserRound size={25} strokeWidth={1.5} /></span><div><h2>{profile?.full_name || user.name}</h2><span className="account-role">{user.role === 'admin' ? 'Administrator' : 'Customer'}</span></div></header>
      {editing ? (
        <form className="checkout-form profile-edit" onSubmit={submit}>
          <div className="form-grid"><label>Full name<input name="full_name" required autoComplete="name" defaultValue={profile?.full_name || ''} /></label><label>Email<input value={user.email} readOnly /></label><label>Phone<input name="phone" type="tel" autoComplete="tel" defaultValue={profile?.phone || ''} /></label></div>
          <div className="account-actions">
          <button disabled={busy} className="button dark-button">{busy ? 'Saving…' : 'Save changes'}</button>
          <button type="button" disabled={busy} className="button outline-button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : <>
        <dl className="account-details"><div><dt>Email address</dt><dd>{user.email}</dd></div><div><dt>Phone number</dt><dd>{profile?.phone || 'Not added yet'}</dd></div></dl>
        <footer className="account-actions"><button className="button dark-button" onClick={() => setEditing(true)}><Pencil size={14} /> Edit profile</button><button className="button outline-button" onClick={() => void logout()}><LogOut size={15} /> Sign out</button></footer>
      </>}
      </article>
      <aside className="account-links">
        <Link className="account-order-link" to="/orders"><Package size={24} strokeWidth={1.5} /><h2>Your orders</h2><p>Check your purchases and follow their progress.</p><span>View order history <ArrowRight size={17} /></span></Link>
        {user.role === 'admin' && <Link className="button outline-button" to="/admin">Open admin dashboard <ArrowRight size={16} /></Link>}
      </aside>
      </div>
    </section>
  );
}
