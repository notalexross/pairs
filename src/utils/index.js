async function fetchImage(fetchUrl) {
  try {
    const response = await fetch(fetchUrl)
    if (!response.ok) throw new Error(response.status)
    const { image: imageUrl } = await response.json()

    return imageUrl
  } catch (err) {
    console.error(err)
  }

  return ''
}

export async function getRandomImages(number = 1) {
  const apiUrl = 'https://foodish-api.herokuapp.com/api/'

  const promises = Array(number)
    .fill()
    .map(() => fetchImage(apiUrl))

  const images = await Promise.all(promises)

  return images
}

function asString(number, minDigits = 0) {
  if (Number.isNaN(parseInt(number, 10))) return ''

  return number.toString().padStart(minDigits, '0')
}

function formatTime(time, { maxThreeUnits = true, showCent = true } = {}) {
  if (Number.isNaN(parseInt(time, 10))) return ''

  const hours = parseInt(time / (60 * 60 * 1000), 10)
  const minutes = parseInt((time / (60 * 1000)) % 60, 10)
  const seconds = parseInt((time / 1000) % 60, 10)
  const centiseconds = parseInt((time % 1000) / 10, 10)

  const centisecondsString = showCent ? ` ${asString(centiseconds, 2)}` : ''

  if (time >= 60 * 60 * 1000) {
    if (maxThreeUnits) {
      return `${hours}h ${asString(minutes, 2)}m ${asString(seconds, 2)}s`
    }

    return `${hours}h ${asString(minutes, 2)}m ${asString(seconds, 2)}s${centisecondsString}`
  }

  if (time >= 60 * 1000) {
    return `${minutes}m ${asString(seconds, 2)}s${centisecondsString}`
  }

  return `${seconds}s${centisecondsString}`
}

export { asString, formatTime }
