import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await api('/auth/register', null, {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          fullName: form.get('fullName'),
        }),
      });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    }
  }
  return (
    <main className="narrow">
      <h1>Create learner account</h1>
      <form onSubmit={submit}>
        <label>
          Full name
          <input name="fullName" minLength={2} required />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength={8} required />
        </label>
        <button>Create account</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        Already registered? <Link to="/login">Sign in</Link>.
      </p>
    </main>
  );
}
