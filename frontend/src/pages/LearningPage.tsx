import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Enrollment, Lesson } from '../types/api';

export function LearningPage() {
  const { enrollmentId } = useParams();
  const { token } = useAuth();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!token || !enrollmentId) return;
    api<Enrollment[]>('/me/enrollments', token)
      .then((items) => {
        const found = items.find((item) => item.id === enrollmentId) ?? null;
        setEnrollment(found);
        return found;
      })
      .then((found) =>
        found
          ? api<{ course: unknown; lessons: Lesson[] }>(
              `/courses/${found.course_id}`,
            ).then((detail) => setLessons(detail.lessons))
          : undefined,
      )
      .catch((err: Error) => setError(err.message));
    api<{ progressPercent: number }>(
      `/enrollments/${enrollmentId}/progress`,
      token,
    )
      .then((result) => setProgress(result.progressPercent))
      .catch(() => undefined);
  }, [token, enrollmentId]);
  async function complete(lessonId: string) {
    if (!token || !enrollmentId) return;
    try {
      const summary = await api<{ progressPercent: number }>(
        `/enrollments/${enrollmentId}/lessons/${lessonId}/complete`,
        token,
        { method: 'POST' },
      );
      setProgress(summary.progressPercent);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not complete lesson.',
      );
    }
  }
  if (!enrollment)
    return (
      <main>
        <p>{error ?? 'Loading your enrollment…'}</p>
      </main>
    );
  return (
    <main>
      <h1>{enrollment.title}</h1>
      <p>Progress: {progress}%</p>
      {error && <p className="error">{error}</p>}
      <section>
        {lessons.map((lesson) => (
          <article className="card" key={lesson.id}>
            <h2>
              {lesson.position}. {lesson.title}
            </h2>
            <pre>{lesson.body_markdown}</pre>
            <button onClick={() => complete(lesson.id)}>
              Mark lesson complete
            </button>
          </article>
        ))}
      </section>
      <Link to={`/assessment/${enrollment.id}/${enrollment.course_id}`}>
        Take course assessment
      </Link>
    </main>
  );
}
