export const normalizeTermInput = (input = {}) => {
  const term =
    input.term ??
    input.TERM ??
    (input.semester ?? input.SEMESTER);

  return {
    ...input,
    term,
  };
};

