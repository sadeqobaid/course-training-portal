export type QuestionOptionInput = { text: string };

export function captureAsyncFormTarget<T extends { reset: () => void }>(target: T): T {
  return target;
}

export function buildQuestionPayload(
  prompt: string,
  position: number,
  options: QuestionOptionInput[],
  correctIndex: number,
) {
  const trimmed = options.map((option) => option.text.trim());
  if (trimmed.some((option) => option.length < 1)) {
    throw new Error('Every answer option must contain text.');
  }
  if (correctIndex < 0 || correctIndex >= trimmed.length) {
    throw new Error('Choose exactly one correct answer option.');
  }
  return {
    prompt: prompt.trim(),
    position,
    options: trimmed.map((optionText, index) => ({
      optionText,
      isCorrect: index === correctIndex,
    })),
  };
}
