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

let page = 0
let matches = books

// Generate a list of books from initial data
loadNextPageOfBooks(matches)

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

// Check if user's browser requests "dark mode" by default
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    ui.settings.themeSelector.value = 'night'
    document.documentElement.style.setProperty('--color-dark', '255, 255, 255')
    document.documentElement.style.setProperty('--color-light', '10, 10, 20')
} else {
    ui.settings.themeSelector.value = 'day'
    document.documentElement.style.setProperty('--color-dark', '10, 10, 20')
    document.documentElement.style.setProperty('--color-light', '255, 255, 255')
}

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
        document.documentElement.style.setProperty('--color-dark', '255, 255, 255')
        document.documentElement.style.setProperty('--color-light', '10, 10, 20')
    } else {
        document.documentElement.style.setProperty('--color-dark', '10, 10, 20')
        document.documentElement.style.setProperty('--color-light', '255, 255, 255')
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
            if (genreMatch) break
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

    page = 0                                        // Reset the global variable
    matches = result                                // Update global books reference

    if (result.length < 1) {                        // If no results are found, display a message overlay
        ui.searchEmptyMessage.classList.add('list__message_show')
    } else {                                        // Else, hide this message
        ui.searchEmptyMessage.classList.remove('list__message_show')
    }

    loadNextPageOfBooks(result)

    window.scrollTo({top: 0, behavior: 'smooth'})   // Go back to top of page
    ui.search.modal.open = false
})

ui.showMoreButton.addEventListener('click', () => {
    page += 1                       // Increment global variable
    loadNextPageOfBooks(matches)    // Add the next page of books
})

ui.itemsList.addEventListener('click', (event) => {
    const pathArray = Array.from(event.path || event.composedPath())
    let active = null

    // Traverse all the nodes from the event down to root
    for (const node of pathArray) {
        if (active) break

        // If our node contains a "data-preview" attribute
        // (meaning, we clicked on a book item, and not an empty space in the "itemsList" container)
        if (node?.dataset?.preview) {
            let result = null

            // Traverse the entire books list
            for (const singleBook of books) {
                if (result) break

                // if our node's "data-preview" attribute matches one of the books
                // set to "result" and "active" (to break out of surrounding loops)
                if (singleBook.id === node?.dataset?.preview) result = singleBook
            } 
        
            active = result
        }
    }

    // If an "active" book is set, display this book
    if (active) {
        ui.bookDisplay.modal.open = true
        ui.bookDisplay.background.src = active.image
        ui.bookDisplay.image.src = active.image
        ui.bookDisplay.title.innerText = active.title
        ui.bookDisplay.subtitle.innerText = `${authors[active.author]} (${new Date(active.published).getFullYear()})`
        ui.bookDisplay.description.innerText = active.description
    }
})

function generateBookListFragment(arrayOfBooks, startIndex, endIndex){
    /* 
      Generate a list of book display components from a section of an array 
      containing book objects
    */
    const container = document.createDocumentFragment()

    for (const { author, id, image, title } of arrayOfBooks.slice(startIndex, endIndex)) {
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

        container.appendChild(element)
    }

    return container
}

function loadNextPageOfBooks(arrayOfBooks){

    // If this is the first page, clear the booklist
    if (page === 0) ui.itemsList.innerHTML = ''

    // Add the next page of books 
    ui.itemsList.appendChild(
        generateBookListFragment(arrayOfBooks, page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE)
    )

    // Update the showMoreButton button display
    const remainingBooks = arrayOfBooks.length - ((page + 1) * BOOKS_PER_PAGE)
    ui.showMoreButton.disabled = remainingBooks < 1
    ui.showMoreButton.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${remainingBooks > 0 ? remainingBooks : 0})</span>
    `
}