import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Certificate } from '../types/api';

export function CertificatesPage() {
  const { token } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (token)
      api<Certificate[]>('/certificates/me', token)
        .then(setCertificates)
        .catch((err: Error) => setError(err.message));
  }, [token]);
  return (
    <main>
      <h1>My certificates</h1>
      {error && <p className="error">{error}</p>}
      <section className="grid">
        {certificates.map((certificate) => (
          <article className="card" key={certificate.certificate_number}>
            <h2>{certificate.title}</h2>
            <p>Certificate number: {certificate.certificate_number}</p>
            <p>Issued: {new Date(certificate.issued_at).toLocaleString()}</p>
            <p>Verification code: {certificate.verification_code}</p>
          </article>
        ))}
      </section>
      {certificates.length === 0 && !error && (
        <p>No certificate has been issued yet.</p>
      )}
    </main>
  );
}
