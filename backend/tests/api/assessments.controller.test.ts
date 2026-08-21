import { describe, expect, it, vi } from 'vitest';
import { AssessmentsController } from '../../src/assessments/assessments.controller.js';
import { AssessmentsService } from '../../src/assessments/assessments.service.js';

describe('AssessmentsController instructor ownership boundary', () => {
  const instructor = {
    id: 'instructor-id', email: 'instructor@example.test', fullName: 'Instructor',
    role: 'INSTRUCTOR' as const, isActive: true,
  };

  it('passes the actor to assessment creation so service ownership rules can be enforced', async () => {
    const service = { create: vi.fn().mockResolvedValue({ id: 'assessment-1' }) } as unknown as AssessmentsService;
    const controller = new AssessmentsController(service);
    const dto = { title: 'Final knowledge check' };
    await expect(controller.create(instructor, 'course-1', dto)).resolves.toEqual({ id: 'assessment-1' });
    expect(service.create).toHaveBeenCalledWith(instructor, 'course-1', dto);
  });

  it('passes the actor to question creation so instructors cannot alter another author’s course', async () => {
    const service = { addQuestion: vi.fn().mockResolvedValue({ id: 'question-1' }) } as unknown as AssessmentsService;
    const controller = new AssessmentsController(service);
    const dto = { prompt: 'Choose the correct answer.', position: 1, options: [{ optionText: 'A', isCorrect: true }, { optionText: 'B', isCorrect: false }] };
    await expect(controller.addQuestion(instructor, 'assessment-1', dto)).resolves.toEqual({ id: 'question-1' });
    expect(service.addQuestion).toHaveBeenCalledWith(instructor, 'assessment-1', dto);
  });
});
