import { describe, expect, it } from 'vitest'
import { COMPANY_MENUS } from '../src/data/companyInputs'
import { emptyCompanyDraft, formatCompanyValue, validateCompanyDraft } from '../src/utils/companyInputs'

function validDraft(menu) {
  const draft = emptyCompanyDraft(menu)
  for (const field of menu.sections.flatMap((section) => section.fields)) {
    if (!field.required) continue
    draft[field.key] = field.options?.[0] || (field.type === 'email' ? 'qa@example.test'
      : field.type === 'date' ? '2099-01-01' : field.type === 'number' ? '1' : 'Pengujian')
  }
  return draft
}

describe('company draft validation', () => {
  it.each(COMPANY_MENUS)('accepts valid $label fields with optional fields empty', (menu) => {
    expect(validateCompanyDraft(menu, validDraft(menu))).toEqual({})
    const keys = menu.sections.flatMap((section) => section.fields.map((field) => field.key))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it.each(['2099-02-29', '2099-13-01', '2099-00-10', '2099-01-32', 'abc'])('rejects malformed calendar date %s', (date) => {
    const menu = COMPANY_MENUS[0]
    expect(validateCompanyDraft(menu, { ...validDraft(menu), start_date: date }).start_date).toBeTruthy()
  })

  it('rejects whitespace-only required fields, invalid email, and manipulated select values', () => {
    const menu = COMPANY_MENUS[0]
    const draft = { ...validDraft(menu), title: '   ', contact_email: 'broken@email', work_mode: 'Manipulated' }
    const errors = validateCompanyDraft(menu, draft)
    expect(Object.keys(errors).sort()).toEqual(['contact_email', 'title', 'work_mode'])
  })

  it.each(COMPANY_MENUS)('rejects invalid email domains in $label', (menu) => {
    for (const contact_email of ['qa@example,com.test', 'qa@exam_ple.test', 'qa@-example.test', 'qa@example-.test', 'qa@example..test']) {
      expect(validateCompanyDraft(menu, { ...validDraft(menu), contact_email }).contact_email).toBe('Masukkan alamat email yang valid.')
    }
    for (const contact_email of ['qa+company@example.test', "o'connor@sub.example.test", ' qa@example.test ']) {
      expect(validateCompanyDraft(menu, { ...validDraft(menu), contact_email })).toEqual({})
    }
  })

  it('allows zero allowance but rejects zero participants without mutating the draft', () => {
    const menu = COMPANY_MENUS[0]
    const draft = { ...validDraft(menu), allowance: '0', quota: '0' }
    const before = { ...draft }
    expect(Object.keys(validateCompanyDraft(menu, draft))).toEqual(['quota'])
    expect(draft).toEqual(before)
  })

  it.each(['salary_min', 'salary_max'])('requires both salary bounds when only %s is supplied', (key) => {
    const menu = COMPANY_MENUS.find((item) => item.key === 'companyJobs')
    const errors = validateCompanyDraft(menu, { ...validDraft(menu), [key]: '4000000' })
    expect(Object.keys(errors)).toEqual([key === 'salary_min' ? 'salary_max' : 'salary_min'])
  })

  it.each([
    ['Rp', ' 100 ', 'Rp 100'],
    ['Rp', '\t4000000\t', 'Rp 4.000.000'],
    ['orang', ' 12 ', '12 orang'],
    ['bulan', ' 2 ', '2 bulan'],
  ])('preserves %s formatting for whitespace-padded input %j', (suffix, raw, expected) => {
    expect(formatCompanyValue({ type: 'number', suffix }, raw)).toBe(expected)
  })

  it('formats Indonesian money, quantities, and dates without mutating inputs', () => {
    expect(formatCompanyValue({ type: 'number', suffix: 'Rp' }, '4000000')).toBe('Rp 4.000.000')
    expect(formatCompanyValue({ type: 'number', suffix: 'orang' }, '12')).toBe('12 orang')
    expect(formatCompanyValue({ type: 'date' }, '2099-01-01')).toBe('1 Jan 2099')
    expect(formatCompanyValue({ type: 'number', suffix: 'Rp' }, '')).toBe('Belum diisi')
    expect(formatCompanyValue({ type: 'number', suffix: 'Rp' }, '-1')).toBe('-1')
  })
})
