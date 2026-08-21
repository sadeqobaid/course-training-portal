import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { User } from '../types/api';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ accessToken: string; user: User }>(
        '/auth/login',
        null,
        {
          method: 'POST',
          body: JSON.stringify({
            email: form.get('email'),
            password: form.get('password'),
          }),
        },
      );
      login(result.accessToken, result.user);
      navigate(
        ['SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR'].includes(result.user.role)
          ? '/workspace'
          : '/my-courses',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    }
  }
  return (
    <main className="narrow">
      <h1>Sign in</h1>
      <form onSubmit={submit}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required />
        </label>
        <button>Sign in</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        Need an account? <Link to="/register">Register</Link>.
      </p>
    </main>
  );
}
