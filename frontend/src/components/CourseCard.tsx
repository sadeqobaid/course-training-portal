import { Link } from 'react-router-dom';
import type { Course } from '../types/api';

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="card">
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <Link to={`/courses/${course.id}`}>View course</Link>
    </article>
  );
}
