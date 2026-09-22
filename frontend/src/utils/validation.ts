/** True when a validation result contains at least one error. */
export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean)
}
