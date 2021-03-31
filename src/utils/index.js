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
  return number.toString().padStart(minDigits, '0')
}

export function formatTime(time, { maxThreeUnits = true, showCent = true } = {}) {
  const hours = parseInt(time / (60 * 60 * 1000), 10)
  const minutes = parseInt((time / (60 * 1000)) % 60, 10)
  const seconds = parseInt((time / 1000) % 60, 10)
  const centiseconds = parseInt((time % 1000) / 10, 10)

  let formattedTime = ''
  if (hours) formattedTime += `${hours}h `
  if (minutes && !hours) {
    formattedTime += `${asString(minutes)}m `
  } else if (minutes) {
    formattedTime += `${asString(minutes, 2)}m `
  }
  if (minutes || hours) {
    formattedTime += `${asString(seconds, 2)}s`
  } else {
    formattedTime += `${asString(seconds)}s`
  }
  if (showCent && (!hours || !maxThreeUnits)) {
    formattedTime += ` ${asString(centiseconds, 2)}`
  }

  return formattedTime
}
