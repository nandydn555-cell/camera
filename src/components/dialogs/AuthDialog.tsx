import type { FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../state/StoreContext';

export default function AuthDialog() {
  const { authOpen, authMode, setAuthOpen, setAuthMode, authenticate, busy } = useStore();
  if (!authOpen) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await authenticate({
        email: String(form.get('email')),
        password: String(form.get('password')),
        name: String(form.get('name') || ''),
      });
    } catch {
      // The provider reports the authentication error in the global toast.
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setAuthOpen(false)}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <button className="modal-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Close sign in">×</button>
        <span className="eyebrow">WELCOME TO LENSLINE</span>
        <h2 id="auth-dialog-title">{authMode === 'register' ? 'Create account' : 'Sign in'}</h2>
        {authMode === 'register' && <label>Full name<input name="name" required autoComplete="name" placeholder="Your name" /></label>}
        <label>Email address<input type="email" name="email" required autoComplete="email" placeholder="you@example.com" /></label>
        <label>Password<input type="password" name="password" required minLength={8} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></label>
        <button disabled={busy} className="button dark-button full">{busy ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button>
        <p className="demo-note">
          {authMode === 'register' ? 'Already have an account?' : 'New to Lensline?'}{' '}
          <button type="button" className="text-link" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>
            {authMode === 'register' ? 'Sign in' : 'Create account'}
          </button>
        </p>
      </form>
    </div>
  );
}
