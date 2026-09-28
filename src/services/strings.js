const build = (acc, [title, value]) => acc.replace(`%${title}`, value);

export const inject = (text, injections) => {
  if (!injections) return text;
  return Object.entries(injections).reduce(build, text);
};
