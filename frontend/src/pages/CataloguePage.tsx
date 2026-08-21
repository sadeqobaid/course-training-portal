import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { CourseCard } from '../components/CourseCard';
import type { Course } from '../types/api';

export function CataloguePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<Course[]>('/courses')
      .then(setCourses)
      .catch((err: Error) => setError(err.message));
  }, []);
  return (
    <main>
      <h1>Published courses</h1>
      <p>Choose a course to read its objective, prerequisites, and lessons.</p>
      {error && <p className="error">{error}</p>}
      <section className="grid">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </section>
      {courses.length === 0 && !error && (
        <section className="card empty-state">
          <h2>No published courses are available yet</h2>
          <p>
            An instructor can create lessons and assessments, but a Training Administrator or System Administrator must publish the course before learners can see it here.
          </p>
        </section>
      )}
    </main>
  );
}
