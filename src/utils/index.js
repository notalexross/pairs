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

async function getRandomImages(number = 1) {
  if (Number.isNaN(parseInt(number, 10))) return []

  const apiUrl = 'https://foodish-api.herokuapp.com/api/'

  const promises = Array(parseInt(number, 10))
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

function isValidPersonalBests(personalBestsObject) {
  const isObject =
    !!personalBestsObject &&
    typeof personalBestsObject === 'object' &&
    !Array.isArray(personalBestsObject)

  if (isObject) {
    const isValidShape = Object.entries(personalBestsObject).every(([difficulty, personalBest]) => {
      const isDifficultyValid = Number.isInteger(Number(difficulty))
      const isMovesValid = Number.isInteger(personalBest.movesMade)
      const isTimeValid = Number.isInteger(personalBest.timeTaken)
      const areRecordsValid = isMovesValid && isTimeValid

      return !isDifficultyValid || areRecordsValid
    })

    return isValidShape
  }

  return false
}

function getShuffled(cards) {
  const cardsCopy = cards.slice()
  const numCards = cardsCopy.length

  const shuffledCards = []
  for (let i = 0; i < numCards; i++) {
    const randomIndex = Math.floor(Math.random() * cardsCopy.length)
    const [randomCard] = cardsCopy.splice(randomIndex, 1)
    shuffledCards[i] = randomCard
  }

  return shuffledCards
}

export { fetchImage, getRandomImages, asString, formatTime, isValidPersonalBests, getShuffled }
