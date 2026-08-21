// - Script name: CourseCard.tsx
// - Original location: frontend/src/components/CourseCard.tsx
// - What this script is: A React functional component that renders a simple course summary card.
// - What it is used for: Displays course title, description, and a link to the course details page in the UI.
// - Programming language: TypeScript with JSX (TSX)
// - Inputs: Props object with a single property `course` of type Course (id, title, description, etc.)
// - Outputs: Rendered JSX elements injected into the browser DOM (visual UI); returns React node.
// - Where output is saved or sent: browser (DOM)
// - Technologies and services used or interacted with: React, react-router-dom (Link), TypeScript types, local project types.
// - Downstream scripts/files/processes that consume the output: Parent components or route pages that render CourseCard; browser users view the rendered card.
// - Risks and safe change note: Changing prop shapes, className, or route path strings can break navigation or rendering; ensure type Course remains compatible and update routes accordingly. UI and accessibility impacts should be validated visually and with tests.
// - created by: Sadeq Obaid

// Import the Link component used to create navigation links in the rendered JSX.
import { Link } from 'react-router-dom';
// Import the Course type to annotate the component props for compile-time safety.
import type { Course } from '../types/api';

// Export a named functional React component that receives a `course` prop typed as Course.
export function CourseCard({ course }: { course: Course }) {
  // Return the JSX structure representing the course card; this is the component's render output.
  return (
    // Render the root element of the card with a CSS class "card" for styling.
    <article className="card">
      // Render the course title within an h2 heading, using the course.title value from props.
      <h2>{course.title}</h2>
      // Render the course description within a paragraph, using the course.description value from props.
      <p>{course.description}</p>
      // Render a Link that navigates to the course detail route using the course.id interpolated in the URL.
      <Link to={`/courses/${course.id}`}>View course</Link>
    // Close the article element begun above.
    </article>
  // Close the JSX returned by the component.
  );
}
// Close the function declaration and export scope.
}
