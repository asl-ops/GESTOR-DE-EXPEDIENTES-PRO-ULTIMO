export const toUiTitleCase = (value?: string | null): string => {
  if (!value) return '';
  const lower = value.toLocaleLowerCase('es-ES');
  return lower.replace(/[\p{L}\p{N}]+(?:['’.\-][\p{L}\p{N}]+)*/gu, (word) => {
    const [first, ...rest] = Array.from(word);
    return `${(first || '').toLocaleUpperCase('es-ES')}${rest.join('')}`;
  });
};

