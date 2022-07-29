export const hasClassContaining = (
  substr: string,
  createElementArgs: any[]
) => {
  return (
    createElementArgs.length >= 1 &&
    createElementArgs[1] &&
    createElementArgs[1].className &&
    createElementArgs[1].className.includes(substr)
  );
};
