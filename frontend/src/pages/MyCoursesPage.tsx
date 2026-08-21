import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Enrollment } from '../types/api';

export function MyCoursesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Enrollment[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (token)
      api<Enrollment[]>('/me/enrollments', token)
        .then(setItems)
        .catch((err: Error) => setError(err.message));
  }, [token]);
  return (
    <main>
      <h1>My courses</h1>
      {error && <p className="error">{error}</p>}
      <section className="grid">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <h2>{item.title}</h2>
            <p>Status: {item.status}</p>
            <Link to={`/learn/${item.id}`}>Continue learning</Link>
          </article>
        ))}
      </section>
      {items.length === 0 && !error && (
        <p>You have not enrolled in a course yet.</p>
      )}
    </main>
  );
}
