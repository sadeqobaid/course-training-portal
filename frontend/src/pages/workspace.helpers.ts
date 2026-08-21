// Script name: workspace.helpers.ts
// Original location: frontend/src/pages/workspace.helpers.ts
// What this script is: Utility helpers for workspace page related to question form handling and payload construction.
// What it is used for: Provides a type for question options, captures form targets for async workflows, and builds validated question payloads.
// Programming language: TypeScript
// Inputs: captureAsyncFormTarget -> a form-like target with reset(): void; buildQuestionPayload -> prompt (string), position (number), options (QuestionOptionInput[]), correctIndex (number).
// Outputs: captureAsyncFormTarget returns the same target reference; buildQuestionPayload returns a plain object { prompt, position, options: [{ optionText, isCorrect }] } or throws on validation failure.
// Where output is saved or sent: Typically sent to an HTTP/API by the caller (this module only returns the payload); not persisted here (caller responsibility).
// Technologies and services used or interacted with: TypeScript, browser form handling patterns; intended for frontend code (React/Vue/Svelte etc.) and downstream API clients.
// Downstream scripts/files/processes that consume the output: workspace page components, form submission handlers, API clients that post question payloads.
// Risks and safe change note: Changing validation logic, returned shape, or error messages will affect consumers and API contracts; keep changes backward compatible and add tests for edge cases (empty options, out-of-range correctIndex).
// created by: Sadeq Obaid

// Define a type alias representing the minimal shape required for an answer option input.
export type QuestionOptionInput = { text: string };

// Export a generic helper function intended to capture a form-like target for use across async operations; the target is constrained to have a reset() method.
export function captureAsyncFormTarget<T extends { reset: () => void }>(target: T): T {
  // Identity return: preserve and return the same target reference so callers can retain it for later asynchronous operations without modification.
  return target;
}
// End of captureAsyncFormTarget function

// Export a function that constructs a validated question payload from provided inputs for submission or further processing.
export function buildQuestionPayload(
  // Parameter: raw question prompt string, may contain surrounding whitespace that will be trimmed.
  prompt: string,
  // Parameter: numeric position or ordering index for the question.
  position: number,
  // Parameter: array of option objects conforming to QuestionOptionInput (each has a text property).
  options: QuestionOptionInput[],
  // Parameter: zero-based index indicating which option in `options` is the correct answer.
  correctIndex: number,
) {
  // Start of function body: compute an array of trimmed option strings from the input option objects.
  const trimmed = options.map((option) => option.text.trim());
  // Validation: ensure no trimmed option string is empty; if any are empty, signal an error to the caller.
  if (trimmed.some((option) => option.length < 1)) {
    // Throwing here prevents constructing a payload with blank answer text; consumer should catch and surface this error.
    throw new Error('Every answer option must contain text.');
  }
  // Validation: ensure the provided correctIndex falls within the bounds of the trimmed options array.
  if (correctIndex < 0 || correctIndex >= trimmed.length) {
    // Throw when correctIndex is invalid to enforce exactly one correct option selection.
    throw new Error('Choose exactly one correct answer option.');
  }
  // Construct and return the payload object with trimmed prompt, given position, and mapped options including correctness flags.
  return {
    // Trim whitespace from the prompt before including it in the payload.
    prompt: prompt.trim(),
    // Include the numeric position unchanged.
    position,
    // Map each trimmed option string to an object with optionText and isCorrect boolean determined by index comparison.
    options: trimmed.map((optionText, index) => ({
      // Provide the trimmed option text as optionText.
      optionText,
      // Mark this option as correct when its index equals the provided correctIndex.
      isCorrect: index === correctIndex,
    })),
  };
}
// End buildQuestionPayload function
