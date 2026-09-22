import { describe, expect, it } from 'vitest'
import { validateLoginForm } from './validateLoginForm'

describe('validateLoginForm', () => {
  it('accepts a valid email and password', () => {
    expect(validateLoginForm({ email: 'demo@jalaspace.app', password: 'demo' })).toEqual({})
  })

  it('requires both fields', () => {
    expect(validateLoginForm({ email: '   ', password: '' })).toEqual({
      email: 'required',
      password: 'required',
    })
  })

  it.each(['demo', 'demo@', 'demo@jalaspace', 'de mo@jalaspace.app'])(
    'rejects the malformed email "%s"',
    (email) => {
      expect(validateLoginForm({ email, password: 'demo' }).email).toBe('invalid')
    },
  )
})
