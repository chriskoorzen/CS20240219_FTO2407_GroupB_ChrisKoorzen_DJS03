/** @import { Book } from './data.js' */
import { books, authors, genres, BOOKS_PER_PAGE } from './data.js'

/**
 * Reference to UI DOM elements. Nested objects also reference UI DOM elements, but represent a 
 * semantic group or "path" to the elements.
 * 
 * @const {object}
 */
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


/**
 * Keep track of current "page" location.
 * Do not load all book objects at once, but "page"
 * through them at user's request.
 *
 * @type {number}
 */
let globalPage = 0


/**
 * Reference to current array of book objects. 
 * Initialize with entire "book" data array.
 *
 * @type {Array<Book>}
 */
let globalMatches = books


/* ----- START: Setup app component functionality ----- */
// --- Basic functionality ---
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

// --- Process user inputs ---
ui.settings.form.addEventListener('submit', (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const { theme } = Object.fromEntries(formData)

    toggleDisplayMode(theme)

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

    globalPage = 0                                  // Reset the global variable
    globalMatches = result                          // Update global books reference

    if (result.length < 1) {                        // If no results are found, display a message overlay
        ui.searchEmptyMessage.classList.add('list__message_show')
    } else {                                        // Else, hide this message
        ui.searchEmptyMessage.classList.remove('list__message_show')
    }

    loadNextPageOfBooks()                           // If not empty, this will load the selected books

    window.scrollTo({top: 0, behavior: 'smooth'})   // Go back to top of page
    ui.search.modal.open = false
})

// Method to load more books onto the UI
ui.showMoreButton.addEventListener('click', () => {
    globalPage += 1            // Increment global variable
    loadNextPageOfBooks()      // Add the next page of books
})

// Method to display singular book item in full
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
/* ----- END: Setup app component functionality ----- */


/**
 * Toggle the UI display between 'day' (light) and 'night' (dark) mode
 *
 * @param {'day' | 'night'} mode
 */
function toggleDisplayMode(mode){
    if (mode === 'night') {
        document.documentElement.style.setProperty('--color-dark', '255, 255, 255')
        document.documentElement.style.setProperty('--color-light', '10, 10, 20')
    } else if (mode === 'day'){
        document.documentElement.style.setProperty('--color-dark', '10, 10, 20')
        document.documentElement.style.setProperty('--color-light', '255, 255, 255')
    }
}


/**
 * Generate a collection of "option" Elements for use in a "select" element.
 *
 * @param {object} data An object with UUID keys and human readable strings as values.
 * @param {?object} [defaultFirstValueProperties=null] An object with attributes (keys) and values for the first default option
 * @returns {DocumentFragment} DocumentFragment containing generated "option" elements
 */
function generateFilterOptionsFragment(data, defaultFirstValueProperties=null){
    const container = document.createDocumentFragment()

    if (defaultFirstValueProperties){
        container.appendChild(
            Object.assign(
                document.createElement('option'),
                defaultFirstValueProperties
            )
        )
    }

    for (const [id, name] of Object.entries(data)) {
        const element = document.createElement('option')
        element.value = id
        element.innerText = name
        container.appendChild(element)
    }

    return container
}


/**
 * Generate a collection of book display components
 *
 * @param {Array<Book>} arrayOfBooks An array containing Book objects
 * @param {number} startIndex Starting index from which to generate components
 * @param {number} endIndex End index from which to generate components
 * @returns {DocumentFragment} DocumentFragment containing generated book UI components
 */
function generateBookListFragment(arrayOfBooks, startIndex, endIndex){
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


/** Updates the UI with the next set (if any) of Book UI components at the user's request */
function loadNextPageOfBooks(){

    // If this is the first page, clear the booklist
    if (globalPage === 0) ui.itemsList.innerHTML = ''

    // Add the next page of books 
    ui.itemsList.appendChild(
        generateBookListFragment(globalMatches, globalPage * BOOKS_PER_PAGE, (globalPage + 1) * BOOKS_PER_PAGE)
    )

    // Update the showMoreButton button display
    const remainingBooks = globalMatches.length - ((globalPage + 1) * BOOKS_PER_PAGE)
    ui.showMoreButton.disabled = remainingBooks < 1
    ui.showMoreButton.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${remainingBooks > 0 ? remainingBooks : 0})</span>
    `
}


/** Functions necessary to set up the starting state of the Application */
function initializeBookConnect(){
    // Load some books for display
    loadNextPageOfBooks()

    // Generate filter options from "authors" and "genres" arrays
    ui.search.genreSelector.appendChild(
        generateFilterOptionsFragment(genres, {value: "any", innerText: "All Genres"})
    )
    ui.search.authorSelector.appendChild(
        generateFilterOptionsFragment(authors, {value: "any", innerText: "All Authors"})
    )

    // Check if user's browser requests "dark mode" by default
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        ui.settings.themeSelector.value = 'night'
        toggleDisplayMode('night')
    } else {
        ui.settings.themeSelector.value = 'day'
        toggleDisplayMode('day')
    }
}

// --- Start App ---
initializeBookConnect()