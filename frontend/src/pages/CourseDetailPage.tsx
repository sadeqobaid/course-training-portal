import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Course, Lesson } from '../types/api';

export function CourseDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<{
    course: Course;
    lessons: Lesson[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (id)
      api<{ course: Course; lessons: Lesson[] }>(`/courses/${id}`)
        .then(setDetail)
        .catch((err: Error) => setError(err.message));
  }, [id]);
  async function enroll() {
    if (!id || !token) {
      navigate('/login');
      return;
    }
    try {
      const enrollment = await api<{ id: string }>(
        `/courses/${id}/enroll`,
        token,
        { method: 'POST' },
      );
      navigate(`/learn/${enrollment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed.');
    }
  }
  if (error)
    return (
      <main>
        <p className="error">{error}</p>
      </main>
    );
  if (!detail)
    return (
      <main>
        <p>Loading course…</p>
      </main>
    );
  return (
    <main>
      <h1>{detail.course.title}</h1>
      <p>{detail.course.description}</p>
      <h2>Objectives</h2>
      <p>{detail.course.objectives}</p>
      <h2>Prerequisites</h2>
      <p>{detail.course.prerequisites || 'No prerequisites.'}</p>
      <h2>Lessons</h2>
      <ol>
        {detail.lessons.map((lesson) => (
          <li key={lesson.id}>{lesson.title}</li>
        ))}
      </ol>
      <button onClick={enroll}>Enroll and start learning</button>
    </main>
  );
}
