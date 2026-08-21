import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Notification } from '../types/api';

export function NotificationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (token)
      api<Notification[]>('/notifications', token)
        .then(setItems)
        .catch((err: Error) => setError(err.message));
  }, [token]);
  async function markRead(id: string) {
    if (!token) return;
    await api(`/notifications/${id}/read`, token, { method: 'PATCH' });
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status: 'READ', read_at: new Date().toISOString() }
          : item,
      ),
    );
  }
  return (
    <main>
      <h1>Notifications</h1>
      {error && <p className="error">{error}</p>}
      {items.map((item) => (
        <article className="card" key={item.id}>
          <h2>{item.subject}</h2>
          <p>{item.body}</p>
          <p>Status: {item.status}</p>
          {!item.read_at && (
            <button onClick={() => markRead(item.id)}>Mark read</button>
          )}
        </article>
      ))}
    </main>
  );
}
