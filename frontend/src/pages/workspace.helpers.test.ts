import { describe, expect, it } from 'vitest';
import { buildQuestionPayload, captureAsyncFormTarget } from './workspace.helpers';

describe('administrator question payload', () => {
  it('marks only the selected option as correct', () => {
    expect(
      buildQuestionPayload('Which option is correct?', 1, [
        { text: 'First' },
        { text: 'Second' },
      ], 1),
    ).toEqual({
      prompt: 'Which option is correct?',
      position: 1,
      options: [
        { optionText: 'First', isCorrect: false },
        { optionText: 'Second', isCorrect: true },
      ],
    });
  });

  it('rejects an empty authoring option before it reaches the API', () => {
    expect(() =>
      buildQuestionPayload('Question', 1, [{ text: 'Yes' }, { text: ' ' }], 0),
    ).toThrow('Every answer option must contain text.');
  });

  it('keeps the synchronously captured form target available after asynchronous work', async () => {
    let resetCount = 0;
    const form = { reset: () => { resetCount += 1; } };
    const capturedForm = captureAsyncFormTarget(form);

    await Promise.resolve();
    capturedForm.reset();

    expect(resetCount).toBe(1);
  });
});
