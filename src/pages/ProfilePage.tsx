import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut, UserRound } from 'lucide-react';
import { useStore } from '../state/StoreContext';

export default function ProfilePage() {
  const { user, profile, busy, updateProfile, signOut, setAuthMode, setAuthOpen } = useStore();
  const navigate = useNavigate();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await updateProfile({ fullName: String(form.get('full_name')), phone: String(form.get('phone')) });
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
    <section className="section">
      <span className="eyebrow">YOUR ACCOUNT</span><h1>Account <em>details.</em></h1>
      <div className="profile-card"><UserRound /><div><h3>{profile?.full_name || user.name}</h3><p>{user.email}</p><span className="eyebrow">{user.role}</span></div><button className="button outline-button" onClick={() => void logout()}><LogOut size={15} /> Sign out</button></div>
      <form className="checkout-form profile-edit" onSubmit={submit}>
        <div className="form-grid"><label>Full name<input name="full_name" required autoComplete="name" defaultValue={profile?.full_name || ''} /></label><label>Email<input value={user.email} readOnly /></label><label>Phone<input name="phone" type="tel" autoComplete="tel" defaultValue={profile?.phone || ''} /></label></div>
        <button disabled={busy} className="button dark-button">{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
      <Link className="text-link" to="/orders">View order history <ArrowRight size={16} /></Link>
      {user.role === 'admin' && <Link className="button dark-button" to="/admin">Open admin dashboard</Link>}
    </section>
  );
}
