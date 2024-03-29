import './index.css'
import MESSAGES from './language'
import { getRandomImages, formatTime, isValidPersonalBests, getShuffled } from './utils'

const { body } = document
const loadingSpinner = document.querySelector('#loading')
const gameStatus = document.querySelector('#game-status')
const grid = document.querySelector('#grid')
const movesContainer = document.querySelectorAll('.moves')
const timerContainer = document.querySelectorAll('.timer')
const pbMovesContainer = document.querySelector('#pb__moves')
const pbTimeContainer = document.querySelector('#pb__time')
const clearStorageButton = document.querySelector('.btn--reset-storage')
const resetButtons = document.querySelectorAll('.btn--reset')
const playAgainButton = document.querySelector('#play-again')
const gameModeButtons = document.querySelectorAll('.btn--game-select')
const changeThemeButton = document.querySelector('.btn--theme')
const gameSelectContainer = document.querySelector('#game-select')
const gameResultsContainer = document.querySelector('#game-results')
const gameResultsMessageContainer = document.querySelector('.game-results__message')
const gameContainer = document.querySelector('#game')

const themes = ['theme-1', 'theme-2', 'theme-3', 'theme-4']
const timeShowNonMatchingPair = 800
const timerInterval = 20
const imageLoadTimeout = 5000
let currentThemeIndex
let timerId
let personalBests
let totalCards
let numCorrectPairs = 0
let currentActiveCard = null
let movesMade = 0
let timeTaken = 0

function display(element) {
  element.style.visibility = 'visible'
}

function hide(element) {
  element.style.visibility = 'hidden'
}

function saveTheme(themeIndex) {
  window.localStorage.setItem('theme', JSON.stringify(themeIndex))
}

function setTheme(themeIndex) {
  currentThemeIndex = themeIndex
  saveTheme(currentThemeIndex)
  themes.forEach(theme => {
    body.classList.remove(theme)
  })
  body.classList.add(themes[currentThemeIndex])
}

function switchTheme() {
  const nextThemeIndex = (currentThemeIndex + 1) % themes.length
  setTheme(nextThemeIndex)
}

function isValidThemeIndex(themeIndex) {
  return Number.isInteger(themeIndex) && themeIndex >= 0 && themeIndex < themes.length
}

function loadTheme() {
  let savedThemeIndex = JSON.parse(window.localStorage.getItem('theme'))
  if (!isValidThemeIndex(savedThemeIndex)) {
    savedThemeIndex = 0
  }

  setTheme(savedThemeIndex)
}

function loadPersonalBests() {
  const savedPersonalBests = JSON.parse(window.localStorage.getItem('personalBests'))
  if (isValidPersonalBests(savedPersonalBests)) {
    personalBests = savedPersonalBests
  } else {
    personalBests = {}
  }
}

function savePersonalBests() {
  window.localStorage.setItem('personalBests', JSON.stringify(personalBests))
}

function hasPersonalBestStored() {
  const personalBest = personalBests[totalCards]
  return typeof personalBest === 'object' && !Array.isArray(personalBest)
}

function isPersonalBest() {
  if (!hasPersonalBestStored()) return true

  const isLessMoves = movesMade < personalBests[totalCards].movesMade
  const isSameMoves = movesMade === personalBests[totalCards].movesMade
  const isLessTime = timeTaken < personalBests[totalCards].timeTaken

  return isLessMoves || (isSameMoves && isLessTime)
}

function updatePersonalBests() {
  personalBests = {
    ...personalBests,
    [totalCards]: { movesMade, timeTaken }
  }

  savePersonalBests()
}

function renderMoves() {
  movesContainer.forEach(container => {
    container.textContent = movesMade
  })
}

function incrementMovesCounter() {
  movesMade += 1
  renderMoves()
}

function renderPersonalBest() {
  if (hasPersonalBestStored()) {
    const { movesMade: movesMadePb, timeTaken: timeTakenPb } = personalBests[totalCards]
    const pbMovesTextContent = movesMadePb === totalCards / 2 ? `${movesMadePb}⭐` : movesMadePb

    pbMovesContainer.textContent = pbMovesTextContent
    pbTimeContainer.textContent = formatTime(timeTakenPb, {
      showCent: false
    })
  } else {
    pbMovesContainer.innerHTML = '&#8734;'
    pbTimeContainer.innerHTML = '&#8734;'
  }
}

function renderTimer() {
  timerContainer.forEach(container => {
    container.textContent = formatTime(timeTaken)
  })
}

function clearTimer() {
  clearInterval(timerId)
}

function isPerfectGame() {
  return personalBests[totalCards].movesMade === totalCards / 2
}

function setGameOverMessage() {
  let gameOverMessage = MESSAGES.NO_PB
  if (isPersonalBest()) {
    updatePersonalBests()
    if (isPerfectGame()) {
      gameOverMessage = MESSAGES.PERFECT_PB
    } else {
      gameOverMessage = MESSAGES.PB
    }
  } else if (isPerfectGame()) {
    gameOverMessage = MESSAGES.PERFECT_NO_PB
  }

  gameResultsMessageContainer.textContent = gameOverMessage
}

function showGameOverModal() {
  setGameOverMessage()

  gameResultsContainer.classList.remove('shown')
  display(gameResultsContainer)
  setTimeout(() => {
    gameResultsContainer.classList.add('shown')
    playAgainButton.focus()
  }, 800)
}

function handleGameOver() {
  setTimeout(() => {
    gameStatus.ariaLabel = 'game finished'
  }, 0)
  clearTimer()
  showGameOverModal()
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

function handleCardClick(event) {
  const card = event.currentTarget.closest('.card')

  if (card.classList.contains('card--active')) return
  card.classList.add('card--active')

  const cardFront = card.querySelector('.card__front')
  const cardBack = card.querySelector('.card__back')

  cardFront.ariaHidden = true
  cardBack.ariaHidden = false
  cardFront.tabIndex = -1

  if (currentActiveCard) {
    const activeCard = currentActiveCard
    const activeCardFront = activeCard.querySelector('.card__front')
    const activeCardBack = activeCard.querySelector('.card__back')
    const isMatchingPair = card.dataset.src === activeCard.dataset.src

    incrementMovesCounter()

    if (isMatchingPair) {
      numCorrectPairs += 1
      if (numCorrectPairs >= totalCards / 2) {
        handleGameOver()
      }
    } else {
      setTimeout(() => {
        card.classList.remove('card--active')
        activeCard.classList.remove('card--active')

        cardFront.ariaHidden = false
        cardBack.ariaHidden = true
        cardFront.tabIndex = 0

        activeCardFront.ariaHidden = false
        activeCardBack.ariaHidden = true
        activeCardFront.tabIndex = 0
      }, timeShowNonMatchingPair)
    }

    currentActiveCard = null
  } else {
    currentActiveCard = card
  }
}

function buildCard(cardWidth, cardIdx) {
  const card = document.createElement('div')

  card.style.width = cardWidth
  card.className = 'card'
  card.innerHTML = `
    <div class="card__ratio">
      <div class="card__ratio__inner">
        <div class="card__inner">
          <button
            class="card__front"
            aria-label="reveal card ${cardIdx + 1} of ${totalCards}"
            aria-hidden="false"
          ></button>
          <div
            class="card__back"
            aria-hidden="true"
          >
            <img
              class="card__image"
              role="alert"
            />
          </div>
        </div>
      </div>
    </div>
  `

  const cardFront = card.querySelector('.card__front')
  cardFront.addEventListener('click', handleCardClick)

  return card
}

function buildCards(cardWidth) {
  const cards = Array(totalCards)
    .fill()
    .map((_, cardIdx) => buildCard(cardWidth, cardIdx))

  return cards
}

async function addImages(cards, imageUrls) {
  const offlineContent = Array(imageUrls.length)
    .fill()
    .map(() => Math.floor(Math.random() * 500).toString())

  const imagesLoaded = cards.map((card, idx) => {
    const cardImage = card.querySelector('.card__image')
    const imageIdx = idx % imageUrls.length

    let image
    if (imageUrls[imageIdx]) {
      image = imageUrls[imageIdx]
    } else {
      image = offlineContent[imageIdx]
    }

    const [imageAlt] = image.split('/').reverse()
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

  return Promise.all(imagesLoaded)
}

function addCardsToGrid(cards) {
  grid.innerHTML = ''
  cards.forEach(card => {
    grid.append(card)
  })
}

async function populateGrid(columns) {
  setIsLoading(true)

  setTimeout(() => {
    gameStatus.ariaLabel = 'loading game'
  }, 0)

  const cardWidth = `${(1 / columns) * 100}%`
  const cards = buildCards(cardWidth)

  addCardsToGrid(cards)

  const shuffledCards = getShuffled(cards)
  const imageUrls = await getRandomImages(totalCards / 2)

  addImages(shuffledCards, imageUrls)
    .catch(err => console.error(err))
    .finally(() => {
      const timeInitial = Date.now()

      timerId = setInterval(() => {
        timeTaken = Date.now() - timeInitial
        renderTimer()
      }, timerInterval)

      setIsLoading(false)

      gameStatus.ariaLabel = 'game started'
    })
}

function resetGameState() {
  clearTimer()
  currentActiveCard = null
  movesMade = 0
  timeTaken = 0
  numCorrectPairs = 0
}

function resetGame(columns, rows) {
  totalCards = Math.floor(columns * rows)
  resetGameState()
  renderMoves()
  renderPersonalBest()
  renderTimer()
}

async function newGame(columns = 4, rows = 4) {
  resetGame(columns, rows)
  populateGrid(columns)
}

function initClearStorageButtonListener() {
  clearStorageButton.addEventListener('click', () => {
    const shouldClear = window.confirm('Clear personal bests and reset your selected theme?')
    if (shouldClear) {
      window.localStorage.clear()
      window.location.reload()
    }
  })
}

function initResetButtonListeners() {
  resetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      grid.innerHTML = ''
      hide(gameContainer)
      hide(gameResultsContainer)
      clearTimer()
      display(gameSelectContainer)
    })
  })
}

function initGameModeButtonListeners() {
  gameModeButtons.forEach(button => {
    const { columns, rows } = button.dataset
    button.addEventListener('click', () => {
      newGame(columns, rows)
      hide(gameSelectContainer)
      display(gameContainer)
    })
  })
}

function initChangeThemeButtonListener() {
  changeThemeButton.addEventListener('click', event => {
    event.target.blur()
    switchTheme()
  })
}

function initListeners() {
  initGameModeButtonListeners()
  initClearStorageButtonListener()
  initChangeThemeButtonListener()
  initResetButtonListeners()
}

function main() {
  loadTheme()
  loadPersonalBests()
  hide(gameContainer)
  hide(gameResultsContainer)
  display(gameSelectContainer)
  initListeners()
  display(body)
}

main()
