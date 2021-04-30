import {
  fetchImage,
  getRandomImages,
  asString,
  formatTime,
  isValidPersonalBests,
  getShuffled
} from './index'

const apiUrl = 'https://foodish-api.herokuapp.com/api/'
const mockJsonData = { image: 'https://foodish-api.herokuapp.com/images/dessert/dessert1.jpg' }

beforeAll(() => {
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockJsonData)
  }))
})

afterAll(() => {
  delete global.fetch
})

describe(`${fetchImage.name}()`, () => {
  test('calls fetch', async () => {
    await fetchImage(apiUrl)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(apiUrl)
  })

  test('returns an image url', async () => {
    const result = await fetchImage(apiUrl)

    expect(result).toBe(mockJsonData.image)
  })

  test('given API is down, returns empty string and logs error', async () => {
    const error = new Error('API is down')
    fetch.mockRejectedValueOnce(error)

    const spy = jest.spyOn(window.console, 'error').mockImplementation()

    const result = await fetchImage(apiUrl)

    expect(result).toBe('')
    expect(spy).toHaveBeenCalledWith(error)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('given API response was not successful, returns empty string and logs error', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: () => Promise.resolve(mockJsonData)
    }
    fetch.mockResolvedValueOnce(mockResponse)

    const spy = jest.spyOn(window.console, 'error').mockImplementation()

    const result = await fetchImage(apiUrl)

    expect(result).toBe('')
    expect(spy).toHaveBeenCalledWith(new Error(mockResponse.status))
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe(`${getRandomImages.name}() with ${fetchImage.name}()`, () => {
  describe('with unexpected inputs', () => {
    const cases = [
      ['null', 'empty array', null, []],
      ['non-numeric string', 'empty array', 'hello', []],
      ['object', 'empty array', {}, []],
      [
        'non-integer',
        'array of images of length parseInt(number, 10)',
        2.888,
        Array(2).fill(mockJsonData.image)
      ],
      [
        'as string',
        'array of images of length parseInt(number, 10)',
        '3',
        Array(3).fill(mockJsonData.image)
      ]
    ]

    test.each(cases)('given number is %s, returns %s', async (_, __, number, expected) => {
      const result = await getRandomImages(number)

      expect(result).toEqual(expected)
    })
  })

  describe('with expected inputs', () => {
    test('given problem with API, returns array of empty strings', async () => {
      const number = 5
      const error = new Error('API is down')
      Array(number).fill().forEach(() => fetch.mockRejectedValueOnce(error))

      const result = await getRandomImages(number)
      const expected = Array(number).fill('')

      expect(result).toEqual(expected)
    })

    test('given no arguments, returns array of single image', async () => {
      const result = await getRandomImages()

      expect(result).toEqual([mockJsonData.image])
    })

    test.each([1, 5, 100])('returns array of images of length %s', async number => {
      const result = await getRandomImages(number)
      const expected = Array(number).fill(mockJsonData.image)

      expect(result).toEqual(expected)
    })
  })
})

describe(`${asString.name}()`, () => {
  describe('with unexpected inputs', () => {
    const cases = [
      ['undefined', 'undefined', 'empty string', undefined, undefined, ''],
      ['null', 'undefined', 'empty string', null, null, ''],
      ['non-numeric string', 'undefined', 'empty string', 'hello', undefined, ''],
      ['object', 'undefined', 'empty string', {}, undefined, ''],
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
      [88, 6, '000088'],
      [88.88, 1, '88.88'],
      [88.88, 6, '088.88']
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

describe(`${formatTime.name}()`, () => {
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

describe(`${isValidPersonalBests.name}()`, () => {
  const cases = [
    ['undefined', 'false', undefined, false],
    ['array', 'true', [], false],
    ['empty object', 'true', {}, true],
    ['expected object', 'true', { 8: { movesMade: 8, timeTaken: 20000 } }, true],
    ['object with numeric key & undefined value', 'true', { 8: undefined }, true],
    ['object with numeric key & empty object value', 'true', { 8: {} }, true],
    ['object with superfluous keys', 'true', { hello: {} }, true],
    [
      'object with numeric key & only superfluous keys in nested object',
      'true',
      { 8: { foo: 8, bar: 20000 } },
      true
    ],
    [
      'object with numeric key & additional superfluous keys in nested object',
      'true',
      { 8: { movesMade: 8, timeTaken: 20000, hello: 'hi' } },
      true
    ]
  ]

  test.each(cases)('given input %s, returns %s', (_, __, input, expected) => {
    const result = isValidPersonalBests(input)

    expect(result).toBe(expected)
  })
})

describe(`${getShuffled.name}()`, () => {
  describe('with unexpected inputs', () => {
    const cases = [
      ['undefined', undefined],
      ['string', 'hello'],
      ['number', 42],
      ['boolean', true],
      ['null', null],
      ['object', {}]
    ]

    test.each(cases)('given input is not an array (%s), returns input', (_, input) => {
      const result = getShuffled(input)

      expect(result).toBe(input)
    })
  })

  describe('with expected inputs', () => {
    let input

    beforeEach(() => {
      input = Array(10)
        .fill()
        .map((_, idx) => ({ idx }))
    })

    test('returns array containing all the same entries as input', () => {
      const result = getShuffled(input)

      input.sort((a, b) => a.idx - b.idx)
      result.sort((a, b) => a.idx - b.idx)

      expect(result).toEqual(input)
      result.forEach((el, idx) => {
        expect(el).toBe(input[idx])
      })
    })

    test('returns shuffled version of input array', () => {
      const result = getShuffled(input)

      expect(result).not.toEqual(input)
    })
  })
})
