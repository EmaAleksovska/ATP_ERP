const FOLD_LOCALES = ['bg', 'en']

export function foldCase(value) {
  if (value == null) return ''
  return String(value).toLocaleLowerCase(FOLD_LOCALES)
}
