// DOM Elements
const quoteText = document.getElementById('text');
const quoteAuthor = document.getElementById('author');
const newQuoteBtn = document.getElementById('new-quote');
const copyQuoteBtn = document.getElementById('copy-quote');
const tweetQuoteBtn = document.getElementById('tweet-quote');
const loadingElement = document.getElementById('loading');
const quoteContent = document.getElementById('quote-content');

// API URL
const API_URL = 'https://api.quotable.io/random';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load initial quote
    fetchNewQuote();
    
    // Set up event listeners
    newQuoteBtn.addEventListener('click', fetchNewQuote);
    copyQuoteBtn.addEventListener('click', copyQuoteToClipboard);
    tweetQuoteBtn.addEventListener('click', tweetQuote);
});

// Fetch a new quote from the API
async function fetchNewQuote() {
    try {
        // Show loading state
        showLoading();
        
        // Fetch quote from API
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Failed to fetch quote');
        }
        
        const data = await response.json();
        
        // Update UI with new quote
        updateQuote(data.content, data.author);
    } catch (error) {
        console.error('Error fetching quote:', error);
        // Fallback quote in case of error
        updateQuote(
            "The greatest glory in living lies not in never falling, but in rising every time we fall.", 
            "Nelson Mandela"
        );
    }
}

// Show loading animation
function showLoading() {
    // Hide quote elements with fade out
    quoteText.parentElement.classList.add('fade-out');
    quoteAuthor.classList.add('fade-out');
    
    // Show loading after a brief delay
    setTimeout(() => {
        quoteText.parentElement.classList.add('hidden');
        quoteAuthor.classList.add('hidden');
        loadingElement.classList.remove('hidden');
    }, 300);
}

// Update the quote display
function updateQuote(text, author) {
    // Hide loading and show quote elements
    loadingElement.classList.add('hidden');
    quoteText.parentElement.classList.remove('hidden');
    quoteAuthor.classList.remove('hidden');
    
    // Set new quote content
    quoteText.textContent = text;
    quoteAuthor.textContent = `- ${author}`;
    
    // Apply fade in animation
    setTimeout(() => {
        quoteText.parentElement.classList.remove('fade-out');
        quoteAuthor.classList.remove('fade-out');
        quoteContent.classList.add('fade-in');
        
        // Remove animation class after it completes
        setTimeout(() => {
            quoteContent.classList.remove('fade-in');
        }, 800);
    }, 50);
}

// Copy quote to clipboard
function copyQuoteToClipboard() {
    const quote = `${quoteText.textContent} ${quoteAuthor.textContent}`;
    
    // Use the Clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(quote)
            .then(() => {
                showCopyFeedback();
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                fallbackCopyToClipboard(quote);
            });
    } else {
        // Fallback method
        fallbackCopyToClipboard(quote);
    }
}

// Fallback method for copying to clipboard
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopyFeedback();
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        alert('Failed to copy quote to clipboard');
    }
    
    document.body.removeChild(textArea);
}

// Show feedback when quote is copied
function showCopyFeedback() {
    const originalText = copyQuoteBtn.innerHTML;
    copyQuoteBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    copyQuoteBtn.style.background = '#4CAF50';
    
    setTimeout(() => {
        copyQuoteBtn.innerHTML = originalText;
        copyQuoteBtn.style.background = '';
    }, 2000);
}

// Tweet the current quote
function tweetQuote() {
    const quote = `${quoteText.textContent} ${quoteAuthor.textContent}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(quote)}&hashtags=Quotify,Inspiration`;
    
    // Open Twitter in a new window
    window.open(twitterUrl, '_blank', 'width=600,height=400');
}