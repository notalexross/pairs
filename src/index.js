// TODO: have card back image split across each card, so it seems like one big picture
import './index.css'
import MESSAGES from './language'
import { getRandomImages, formatTime } from './utils'

const { body } = document
const loadingSpinner = document.querySelector('#loading')
const grid = document.querySelector('#grid')
const movesContainer = document.querySelectorAll('.moves')
const timerContainer = document.querySelectorAll('.timer')
const pbMovesContainer = document.querySelector('#pb__moves')
const pbTimeContainer = document.querySelector('#pb__time')
const clearStorageButton = document.querySelector('.btn--reset-storage')
const resetButtons = document.querySelectorAll('.btn--reset')
const gameModeButtons = document.querySelectorAll('.btn--game-select')
const themeButton = document.querySelector('.btn--theme')
const gameSelectContainer = document.querySelector('#game-select')
const gameResultsContainer = document.querySelector('#game-results')
const gameResultsMessageContainer = document.querySelector('.game-results__message')
const gameContainer = document.querySelector('#game')

const themes = ['theme-1', 'theme-2', 'theme-3', 'theme-4']
const timeShown = 800
const timerInterval = 20
const imageLoadTimeout = 5000
let moves
let time
let pairs
let numRows
let numColumns
let currentActiveCard
let numPairs
let personalBests
let timerId
let currentTheme

function saveTheme(theme) {
  window.localStorage.setItem('theme', JSON.stringify(theme))
}

function switchTheme(setTheme = false) {
  const themeIndex = themes.findIndex(theme => theme === currentTheme)

  let nextThemeIndex
  if (setTheme && themeIndex >= 0) {
    nextThemeIndex = themeIndex
  } else {
    nextThemeIndex = (themeIndex + 1) % themes.length
  }

  currentTheme = themes[nextThemeIndex]
  saveTheme(currentTheme)

  themes.forEach(theme => {
    body.classList.remove(theme)
  })
  body.classList.add(currentTheme)
}

function loadTheme() {
  currentTheme = JSON.parse(window.localStorage.getItem('theme'))
  switchTheme(true)
  body.style.visibility = 'visible'
}

function loadPersonalBests() {
  personalBests = JSON.parse(window.localStorage.getItem('personalBests')) || {}
}

function savePersonalBests() {
  window.localStorage.setItem('personalBests', JSON.stringify(personalBests))
}

function isPersonalBest() {
  if (!personalBests[numPairs]) return true

  const isLessMoves = moves < personalBests[numPairs].moves
  const isSameMoves = moves === personalBests[numPairs].moves
  const isLessTime = time < personalBests[numPairs].time

  if (isLessMoves || (isSameMoves && isLessTime)) {
    return true
  }

  return false
}

function updatePersonalBests() {
  personalBests = {
    ...personalBests,
    [numPairs]: { moves, time }
  }
  savePersonalBests()
}

function renderMoves() {
  movesContainer.forEach(el => {
    el.textContent = moves
  })
  if (personalBests[numPairs]) {
    const movesPB = personalBests[numPairs].moves
    const movesText = movesPB === numPairs ? `${movesPB}⭐` : movesPB
    pbMovesContainer.textContent = movesText
    pbTimeContainer.textContent = formatTime(personalBests[numPairs].time, { showCent: false })
  } else {
    pbMovesContainer.innerHTML = '&#8734;'
    pbTimeContainer.innerHTML = '&#8734;'
  }
}

function incrementMovesCounter() {
  moves += 1
  renderMoves()
}

function renderTimer() {
  const formattedTime = formatTime(time)
  timerContainer.forEach(el => {
    el.textContent = formattedTime
  })
}

function clearTimer() {
  clearInterval(timerId)
}

function display(element) {
  element.style.visibility = 'visible'
}

function hide(element) {
  element.style.visibility = 'hidden'
}

function handleGameOver() {
  clearTimer()

  let message
  if (isPersonalBest()) {
    updatePersonalBests()
    if (personalBests[numPairs].moves === numPairs) {
      message = MESSAGES.PERFECT_PB
    } else {
      message = MESSAGES.PB
    }
  } else if (personalBests[numPairs].moves === numPairs) {
    message = MESSAGES.PERFECT_NO_PB
  } else {
    message = MESSAGES.NO_PB
  }

  gameResultsMessageContainer.textContent = message
  gameResultsContainer.classList.remove('shown')
  display(gameResultsContainer)
  setTimeout(() => {
    gameResultsContainer.classList.add('shown')
  }, timeShown)
}

function setIsLoading(isLoading) {
  if (isLoading) {
    display(loadingSpinner)
    hide(grid)
  } else {
    display(grid)
    hide(loadingSpinner)
  }
}

function buildCard(cardWidth) {
  const card = document.createElement('div')

  card.style.width = cardWidth
  card.className = 'card'
  card.innerHTML = `
        <div class="card__ratio">
            <div class="card__ratio__inner">
                <div class="card__inner"> 
                    <div class="card__front"></div>
                    <div class="card__back">
                        <img
                            class="card__image"
                        />
                    </div>
                </div>
            </div>
        </div>
    `

  const cardFront = card.querySelector('.card__front')

  function clickHandler() {
    if (card.classList.contains('card--active')) return
    card.classList.add('card--active')

    if (currentActiveCard) {
      const activeCard = currentActiveCard
      const isPair = card.dataset.src === activeCard.dataset.src
      incrementMovesCounter()
      currentActiveCard = undefined
      if (isPair) {
        pairs += 1
        if (pairs >= numPairs) {
          handleGameOver()
        }
      } else {
        setTimeout(() => {
          card.classList.remove('card--active')
          activeCard.classList.remove('card--active')
        }, timeShown)
      }
    } else {
      currentActiveCard = card
    }
  }

  cardFront.addEventListener('click', clickHandler)

  return card
}

function buildCards(cardWidth) {
  const cards = Array(2 * numPairs)
    .fill()
    .map(() => buildCard(cardWidth))
  return cards
}

function getShuffledCards(cards) {
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

async function addImages(cards, images) {
  const offlineContent = Array(images.length)
    .fill()
    .map(() => Math.floor(Math.random() * 500).toString())

  const promises = cards.map((card, idx) => {
    const cardImage = card.querySelector('.card__image')
    const imageIdx = idx % images.length

    let image
    if (images[imageIdx]) {
      image = images[imageIdx]
    } else {
      image = offlineContent[imageIdx]
    }

    const imageAlt = image.split('/').reverse()[0]
    card.dataset.src = image
    cardImage.src = image
    cardImage.alt = imageAlt
    cardImage.title = imageAlt

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Image took too long to load'))
      }, imageLoadTimeout)

      cardImage.addEventListener('load', () => {
        clearTimeout(timeoutId)
        resolve()
      })
    })
  })

  return Promise.all(promises)
}

async function populateGrid() {
  setIsLoading(true)
  const cardWidth = `${(1 / numColumns) * 100}%`
  const cards = buildCards(cardWidth)

  grid.innerHTML = ''
  cards.forEach(card => {
    grid.append(card)
  })

  const shuffledCards = getShuffledCards(cards)

  const images = await getRandomImages(numPairs)

  addImages(shuffledCards, images)
    .catch(err => console.error(err))
    .finally(() => {
      setIsLoading(false)
      const timeInitial = Date.now()
      clearTimer() // Shouldn't be necessary, but just to be sure.
      timerId = setInterval(() => {
        time = Date.now() - timeInitial
        renderTimer()
      }, timerInterval)
    })
}

function resetGame(columns, rows) {
  currentActiveCard = undefined
  clearTimer()
  numColumns = columns
  numRows = rows
  moves = 0
  time = 0
  pairs = 0
  numPairs = Math.floor((numColumns * numRows) / 2)
  renderMoves()
  renderTimer()
}

async function newGame(columns = 4, rows = 4) {
  resetGame(columns, rows)
  populateGrid()
}

function initListeners() {
  clearStorageButton.addEventListener('click', () => {
    const shouldClear = window.confirm('Clear personal bests and reset your selected theme?')
    if (shouldClear) {
      window.localStorage.clear()
      window.location.reload()
    }
  })

  resetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      grid.innerHTML = ''
      hide(gameContainer)
      hide(gameResultsContainer)
      clearTimer()
      display(gameSelectContainer)
    })
  })

  gameModeButtons.forEach(button => {
    const { columns, rows } = button.dataset
    button.addEventListener('click', () => {
      newGame(columns, rows)
      hide(gameSelectContainer)
      display(gameContainer)
    })
  })

  themeButton.addEventListener('click', event => {
    event.target.blur()
    switchTheme()
  })
}

function main() {
  loadTheme()
  loadPersonalBests()
  hide(gameContainer)
  hide(gameResultsContainer)
  display(gameSelectContainer)
  initListeners()
}

main()
