import { books, authors, genres, BOOKS_PER_PAGE } from './data.js'

// Get reference to UI elements
const ui = {
    // Main
    itemsList: document.querySelector('[data-list-items]'),
    showMoreButton: document.querySelector('[data-list-button]'),
    searchEmptyMessage: document.querySelector('[data-list-message]'),

    // Book Display Modal
    bookDisplay: {
        modal: document.querySelector('[data-list-active]'),
        title: document.querySelector('[data-list-title]'),
        subtitle: document.querySelector('[data-list-subtitle]'),
        description: document.querySelector('[data-list-description]'),
        image: document.querySelector('[data-list-image]'),
        background: document.querySelector('[data-list-blur]'),
        closeButton: document.querySelector('[data-list-close]'),
    },

    // Search Modal
    search: {
        modal: document.querySelector('[data-search-overlay]'),
        form: document.querySelector('[data-search-form]'),
        titleInput: document.querySelector('[data-search-title]'),
        genreSelector: document.querySelector('[data-search-genres]'),
        authorSelector: document.querySelector('[data-search-authors]'),
        cancelButton: document.querySelector('[data-search-cancel]'),
        openButton: document.querySelector('[data-header-search]'),
    },

    // Settings Modal
    settings: {
        modal: document.querySelector('[data-settings-overlay]'),
        form: document.querySelector('[data-settings-form]'),
        themeSelector: document.querySelector('[data-settings-theme]'),
        cancelButton: document.querySelector('[data-settings-cancel]'),
        openButton: document.querySelector('[data-header-settings]'),
    },
}

let page = 1;
let matches = books

const starting = document.createDocumentFragment()

for (const { author, id, image, title } of matches.slice(0, BOOKS_PER_PAGE)) {
    const element = document.createElement('button')
    element.classList = 'preview'
    element.setAttribute('data-preview', id)

    element.innerHTML = `
        <img
            class="preview__image"
            src="${image}"
        />
        
        <div class="preview__info">
            <h3 class="preview__title">${title}</h3>
            <div class="preview__author">${authors[author]}</div>
        </div>
    `

    starting.appendChild(element)
}

ui.itemsList.appendChild(starting)

const genreHtml = document.createDocumentFragment()
const firstGenreElement = document.createElement('option')
firstGenreElement.value = 'any'
firstGenreElement.innerText = 'All Genres'
genreHtml.appendChild(firstGenreElement)

for (const [id, name] of Object.entries(genres)) {
    const element = document.createElement('option')
    element.value = id
    element.innerText = name
    genreHtml.appendChild(element)
}

ui.search.genreSelector.appendChild(genreHtml)

const authorsHtml = document.createDocumentFragment()
const firstAuthorElement = document.createElement('option')
firstAuthorElement.value = 'any'
firstAuthorElement.innerText = 'All Authors'
authorsHtml.appendChild(firstAuthorElement)

for (const [id, name] of Object.entries(authors)) {
    const element = document.createElement('option')
    element.value = id
    element.innerText = name
    authorsHtml.appendChild(element)
}

ui.search.authorSelector.appendChild(authorsHtml)

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    ui.settings.themeSelector.value = 'night'
    document.documentElement.style.setProperty('--color-dark', '255, 255, 255');
    document.documentElement.style.setProperty('--color-light', '10, 10, 20');
} else {
    ui.settings.themeSelector.value = 'day'
    document.documentElement.style.setProperty('--color-dark', '10, 10, 20');
    document.documentElement.style.setProperty('--color-light', '255, 255, 255');
}

ui.showMoreButton.innerText = `Show more (${books.length - BOOKS_PER_PAGE})`
ui.showMoreButton.disabled = (matches.length - (page * BOOKS_PER_PAGE)) > 0

ui.showMoreButton.innerHTML = `
    <span>Show more</span>
    <span class="list__remaining"> (${(matches.length - (page * BOOKS_PER_PAGE)) > 0 ? (matches.length - (page * BOOKS_PER_PAGE)) : 0})</span>
`

ui.search.cancelButton.addEventListener('click', () => {
    ui.search.modal.open = false
})

ui.settings.cancelButton.addEventListener('click', () => {
    ui.settings.modal.open = false
})

ui.search.openButton.addEventListener('click', () => {
    ui.search.modal.open = true 
    ui.search.titleInput.focus()
})

ui.settings.openButton.addEventListener('click', () => {
    ui.settings.modal.open = true 
})

ui.bookDisplay.closeButton.addEventListener('click', () => {
    ui.bookDisplay.modal.open = false
})

ui.settings.form.addEventListener('submit', (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const { theme } = Object.fromEntries(formData)

    if (theme === 'night') {
        document.documentElement.style.setProperty('--color-dark', '255, 255, 255');
        document.documentElement.style.setProperty('--color-light', '10, 10, 20');
    } else {
        document.documentElement.style.setProperty('--color-dark', '10, 10, 20');
        document.documentElement.style.setProperty('--color-light', '255, 255, 255');
    }
    
    ui.settings.modal.open = false
})

ui.search.form.addEventListener('submit', (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const filters = Object.fromEntries(formData)
    const result = []

    for (const book of books) {
        let genreMatch = filters.genre === 'any'

        for (const singleGenre of book.genres) {
            if (genreMatch) break;
            if (singleGenre === filters.genre) { genreMatch = true }
        }

        if (
            (filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase())) && 
            (filters.author === 'any' || book.author === filters.author) && 
            genreMatch
        ) {
            result.push(book)
        }
    }

    page = 1;
    matches = result

    if (result.length < 1) {
        ui.searchEmptyMessage.classList.add('list__message_show')
    } else {
        ui.searchEmptyMessage.classList.remove('list__message_show')
    }

    ui.itemsList.innerHTML = ''
    const newItems = document.createDocumentFragment()

    for (const { author, id, image, title } of result.slice(0, BOOKS_PER_PAGE)) {
        const element = document.createElement('button')
        element.classList = 'preview'
        element.setAttribute('data-preview', id)
    
        element.innerHTML = `
            <img
                class="preview__image"
                src="${image}"
            />
            
            <div class="preview__info">
                <h3 class="preview__title">${title}</h3>
                <div class="preview__author">${authors[author]}</div>
            </div>
        `

        newItems.appendChild(element)
    }

    ui.itemsList.appendChild(newItems)
    ui.showMoreButton.disabled = (matches.length - (page * BOOKS_PER_PAGE)) < 1

    ui.showMoreButton.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${(matches.length - (page * BOOKS_PER_PAGE)) > 0 ? (matches.length - (page * BOOKS_PER_PAGE)) : 0})</span>
    `

    window.scrollTo({top: 0, behavior: 'smooth'});
    ui.search.modal.open = false
})

ui.showMoreButton.addEventListener('click', () => {
    const fragment = document.createDocumentFragment()

    for (const { author, id, image, title } of matches.slice(page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE)) {
        const element = document.createElement('button')
        element.classList = 'preview'
        element.setAttribute('data-preview', id)
    
        element.innerHTML = `
            <img
                class="preview__image"
                src="${image}"
            />
            
            <div class="preview__info">
                <h3 class="preview__title">${title}</h3>
                <div class="preview__author">${authors[author]}</div>
            </div>
        `

        fragment.appendChild(element)
    }

    ui.itemsList.appendChild(fragment)
    page += 1
})

ui.itemsList.addEventListener('click', (event) => {
    const pathArray = Array.from(event.path || event.composedPath())
    let active = null

    for (const node of pathArray) {
        if (active) break

        if (node?.dataset?.preview) {
            let result = null
    
            for (const singleBook of books) {
                if (result) break;
                if (singleBook.id === node?.dataset?.preview) result = singleBook
            } 
        
            active = result
        }
    }
    
    if (active) {
        ui.bookDisplay.modal.open = true
        ui.bookDisplay.background.src = active.image
        ui.bookDisplay.image.src = active.image
        ui.bookDisplay.title.innerText = active.title
        ui.bookDisplay.subtitle.innerText = `${authors[active.author]} (${new Date(active.published).getFullYear()})`
        ui.bookDisplay.description.innerText = active.description
    }
})