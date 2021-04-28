import { asString, formatTime } from './index'

describe(`${asString.name} function`, () => {
  describe('with unexpected inputs', () => {
    const cases = [
      ['undefined', 'undefined', 'empty string', undefined, undefined, ''],
      ['non-numeric string', 'undefined', 'empty string', 'hello', undefined, ''],
      ['object', 'undefined', 'empty string', {}, undefined, ''],
      ['non-integer', 'undefined', 'empty string', {}, undefined, ''],
      ['as string', 'undefined', 'expected output', '5', undefined, '5'],
      ['as string', 'integer', 'expected output', '5', 2, '05'],
      ['numeric', 'an object', 'number as string', 5, {}, '5'],
      ['numeric', 'null', 'number as string', 5, null, '5']
    ]

    test.each(cases)(
      'given number is %s & minDigits is %s, returns %s',
      (_, __, ___, number, minDigits, expected) => {
        const result = asString(number, minDigits)

        expect(result).toBe(expected)
      }
    )
  })

  describe('with expected inputs', () => {
    const cases = [
      [4, undefined, '4'],
      [4, 1, '4'],
      [4, 2, '04'],
      [42, undefined, '42'],
      [42, 0, '42'],
      [42, 1, '42'],
      [42, 2, '42'],
      [42, 3, '042'],
      [88, 6, '000088']
    ]

    test.each(cases)(
      'given number is %s & minDigits is %s, returns %s',
      (number, minDigits, expected) => {
        const result = asString(number, minDigits)

        expect(result).toBe(expected)
      }
    )
  })
})

describe(`${formatTime.name} function`, () => {
  describe('with unexpected inputs', () => {
    const cases = [
      ['undefined', 'empty string', undefined, ''],
      ['string', 'empty string', 'hello', ''],
      ['object', 'empty string', {}, ''],
      ['non-integer', 'rounded value', 1111.11, '1s 11']
    ]

    test.each(cases)('given time is %s, returns %s', (_, __, time, expected) => {
      const result = formatTime(time)

      expect(result).toBe(expected)
    })
  })

  describe('with expected inputs', () => {
    const cs = 10
    const s = 100 * cs
    const m = 60 * s
    const h = 60 * m

    const cases = [
      [0, {}, '0s 00'],
      [s + 1 * cs, {}, '1s 01'],
      [59 * s, {}, '59s 00'],
      [m, {}, '1m 00s 00'],
      [h + 42 * cs, {}, '1h 00m 00s'],
      [h + 21 * cs, {}, '1h 00m 00s'],
      [10 * h, {}, '10h 00m 00s'],
      [1000 * h, {}, '1000h 00m 00s'],
      [100 * h + 42 * cs, { maxThreeUnits: true }, '100h 00m 00s'],
      [100 * h + 42 * cs, { maxThreeUnits: false }, '100h 00m 00s 42'],
      [10 * m + 42 * cs, { showCent: true }, '10m 00s 42'],
      [10 * m, { showCent: false }, '10m 00s'],
      [0, { showCent: false }, '0s']
    ]

    test.each(cases)('given time = %s ms & options = %s, returns %s', (time, options, expected) => {
      const result = formatTime(time, options)

      expect(result).toBe(expected)
    })
  })
})
