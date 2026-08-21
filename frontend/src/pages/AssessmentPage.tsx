import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type AssessmentResponse = {
  assessment: { id: string; title: string };
  questions: {
    id: string;
    prompt: string;
    position: number;
    option_id: string;
    option_text: string;
  }[];
};

export function AssessmentPage() {
  const { enrollmentId, courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<AssessmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (token && courseId)
      api<AssessmentResponse>(`/courses/${courseId}/assessment`, token)
        .then(setData)
        .catch((err: Error) => setError(err.message));
  }, [token, courseId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !enrollmentId || !data) return;
    const form = new FormData(event.currentTarget);
    const questionIds = [
      ...new Set(data.questions.map((question) => question.id)),
    ];
    const answers = questionIds.map((questionId) => ({
      questionId,
      optionId: String(form.get(questionId) ?? ''),
    }));
    try {
      const result = await api<{
        scorePercent: number;
        passed: boolean;
        certificate: { verification_code: string } | null;
      }>(
        `/enrollments/${enrollmentId}/assessments/${data.assessment.id}/attempts`,
        token,
        { method: 'POST', body: JSON.stringify({ answers }) },
      );
      alert(
        `Score: ${result.scorePercent}%. ${result.passed ? 'You passed.' : 'You did not pass yet.'}`,
      );
      navigate(result.certificate ? '/certificates' : `/learn/${enrollmentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    }
  }
  if (error && !data)
    return (
      <main>
        <p className="error">{error}</p>
      </main>
    );
  if (!data)
    return (
      <main>
        <p>Loading assessment…</p>
      </main>
    );
  const grouped = [
    ...new Map(
      data.questions.map((question) => [
        question.id,
        {
          prompt: question.prompt,
          position: question.position,
          options: data.questions.filter((option) => option.id === question.id),
        },
      ]),
    ).entries(),
  ];
  return (
    <main>
      <h1>{data.assessment.title}</h1>
      <form onSubmit={submit}>
        {grouped.map(([id, question]) => (
          <fieldset key={id}>
            <legend>
              {question.position}. {question.prompt}
            </legend>
            {question.options.map((option) => (
              <label key={option.option_id}>
                <input
                  type="radio"
                  name={id}
                  value={option.option_id}
                  required
                />
                {option.option_text}
              </label>
            ))}
          </fieldset>
        ))}
        <button>Submit assessment</button>
      </form>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
