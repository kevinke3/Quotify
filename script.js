// DOM Elements
const quoteText = document.getElementById('text');
const quoteAuthor = document.getElementById('author');
const newQuoteBtn = document.getElementById('new-quote');
const copyQuoteBtn = document.getElementById('copy-quote');
const tweetQuoteBtn = document.getElementById('tweet-quote');
const prevQuoteBtn = document.getElementById('prev-quote');
const nextQuoteBtn = document.getElementById('next-quote');
const loadingElement = document.getElementById('loading');
const quoteContent = document.getElementById('quote-content');
const currentQuoteSpan = document.getElementById('current-quote');
const totalQuotesSpan = document.getElementById('total-quotes');

// Store quotes and track current quote index
let quotes = [];
let currentQuoteIndex = 0;
const TOTAL_QUOTES = 60;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load initial quotes
    loadQuotes();
    
    // Set up event listeners
    newQuoteBtn.addEventListener('click', loadQuotes);
    copyQuoteBtn.addEventListener('click', copyQuoteToClipboard);
    tweetQuoteBtn.addEventListener('click', tweetQuote);
    prevQuoteBtn.addEventListener('click', showPreviousQuote);
    nextQuoteBtn.addEventListener('click', showNextQuote);
});

// Load quotes - using local storage to cache quotes
async function loadQuotes() {
    try {
        // Show loading state
        showLoading();
        
        // Check if we have cached quotes
        const cachedQuotes = localStorage.getItem('cachedQuotes');
        const cacheTimestamp = localStorage.getItem('quotesCacheTimestamp');
        const isCacheValid = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < 24 * 60 * 60 * 1000; // 24 hours
        
        if (cachedQuotes && isCacheValid) {
            // Use cached quotes
            quotes = JSON.parse(cachedQuotes);
            currentQuoteIndex = 0;
            updateQuoteDisplay();
            updateCounter();
        } else {
            // Fetch new quotes from API in batches (API limit is 20 per request)
            await fetchAllQuotes();
        }
    } catch (error) {
        console.error('Error loading quotes:', error);
        // Use fallback quotes
        quotes = getFallbackQuotes();
        currentQuoteIndex = 0;
        updateQuoteDisplay();
        updateCounter();
    }
}

// Fetch all quotes in batches
async function fetchAllQuotes() {
    const batches = 3; // 3 batches of 20 quotes = 60 quotes
    quotes = [];
    
    for (let i = 0; i < batches; i++) {
        try {
            const response = await fetch('https://api.quotable.io/quotes/random?limit=20');
            if (!response.ok) throw new Error('Failed to fetch quotes');
            const batchQuotes = await response.json();
            quotes.push(...batchQuotes);
            
            // Update progress
            const progress = ((i + 1) / batches) * 100;
            updateLoadingProgress(progress);
        } catch (error) {
            console.error(`Error fetching batch ${i + 1}:`, error);
            // Fill with fallback quotes if API fails
            const fallbackBatch = getFallbackQuotes().slice(i * 20, (i + 1) * 20);
            quotes.push(...fallbackBatch);
        }
    }
    
    // Cache the quotes
    localStorage.setItem('cachedQuotes', JSON.stringify(quotes));
    localStorage.setItem('quotesCacheTimestamp', Date.now().toString());
    
    currentQuoteIndex = 0;
    updateQuoteDisplay();
    updateCounter();
}

// Update loading progress
function updateLoadingProgress(progress) {
    const loadingText = loadingElement.querySelector('p');
    if (loadingText) {
        loadingText.textContent = `Loading quotes... ${Math.round(progress)}%`;
    }
}

// Show loading animation
function showLoading() {
    quoteText.parentElement.classList.add('fade-out');
    quoteAuthor.classList.add('fade-out');
    
    setTimeout(() => {
        quoteText.parentElement.classList.add('hidden');
        quoteAuthor.classList.add('hidden');
        loadingElement.classList.remove('hidden');
        updateLoadingProgress(0);
    }, 300);
}

// Update the quote display
function updateQuoteDisplay() {
    loadingElement.classList.add('hidden');
    quoteText.parentElement.classList.remove('hidden');
    quoteAuthor.classList.remove('hidden');
    
    const currentQuote = quotes[currentQuoteIndex];
    quoteText.textContent = currentQuote.content;
    quoteAuthor.textContent = `- ${currentQuote.author}`;
    
    setTimeout(() => {
        quoteText.parentElement.classList.remove('fade-out');
        quoteAuthor.classList.remove('fade-out');
        quoteContent.classList.add('fade-in');
        
        setTimeout(() => {
            quoteContent.classList.remove('fade-in');
        }, 800);
    }, 50);
}

// Update the quote counter
function updateCounter() {
    currentQuoteSpan.textContent = currentQuoteIndex + 1;
    totalQuotesSpan.textContent = quotes.length;
    
    // Update button states
    prevQuoteBtn.disabled = currentQuoteIndex === 0;
    nextQuoteBtn.disabled = currentQuoteIndex === quotes.length - 1;
    
    // Visual feedback for disabled buttons
    prevQuoteBtn.style.opacity = currentQuoteIndex === 0 ? '0.6' : '1';
    nextQuoteBtn.style.opacity = currentQuoteIndex === quotes.length - 1 ? '0.6' : '1';
}

// Show previous quote
function showPreviousQuote() {
    if (currentQuoteIndex > 0) {
        currentQuoteIndex--;
        updateQuoteDisplay();
        updateCounter();
    }
}

// Show next quote
function showNextQuote() {
    if (currentQuoteIndex < quotes.length - 1) {
        currentQuoteIndex++;
        updateQuoteDisplay();
        updateCounter();
    }
}

// Copy quote to clipboard
function copyQuoteToClipboard() {
    const currentQuote = quotes[currentQuoteIndex];
    const quote = `${currentQuote.content} - ${currentQuote.author}`;
    
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
        fallbackCopyToClipboard(quote);
    }
}

// Fallback method for copying to clipboard
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
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
    const currentQuote = quotes[currentQuoteIndex];
    const quote = `${currentQuote.content} - ${currentQuote.author}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(quote)}&hashtags=Quotify,Inspiration`;
    
    window.open(twitterUrl, '_blank', 'width=600,height=400');
}

// Fallback quotes in case API fails
function getFallbackQuotes() {
    return [
        {
            content: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
            author: "Nelson Mandela"
        },
        {
            content: "The way to get started is to quit talking and begin doing.",
            author: "Walt Disney"
        },
        {
            content: "Your time is limited, so don't waste it living someone else's life.",
            author: "Steve Jobs"
        },
        {
            content: "If life were predictable it would cease to be life, and be without flavor.",
            author: "Eleanor Roosevelt"
        },
        {
            content: "If you look at what you have in life, you'll always have more.",
            author: "Oprah Winfrey"
        },
        {
            content: "Life is what happens when you're busy making other plans.",
            author: "John Lennon"
        },
        {
            content: "Spread love everywhere you go. Let no one ever come to you without leaving happier.",
            author: "Mother Teresa"
        },
        {
            content: "When you reach the end of your rope, tie a knot in it and hang on.",
            author: "Franklin D. Roosevelt"
        },
        {
            content: "Always remember that you are absolutely unique. Just like everyone else.",
            author: "Margaret Mead"
        },
        {
            content: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
            author: "Robert Louis Stevenson"
        },
        {
            content: "The future belongs to those who believe in the beauty of their dreams.",
            author: "Eleanor Roosevelt"
        },
        {
            content: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
            author: "Benjamin Franklin"
        },
        {
            content: "The best and most beautiful things in the world cannot be seen or even touched — they must be felt with the heart.",
            author: "Helen Keller"
        },
        {
            content: "It is during our darkest moments that we must focus to see the light.",
            author: "Aristotle"
        },
        {
            content: "Whoever is happy will make others happy too.",
            author: "Anne Frank"
        },
        {
            content: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
            author: "Ralph Waldo Emerson"
        },
        {
            content: "You will face many defeats in life, but never let yourself be defeated.",
            author: "Maya Angelou"
        },
        {
            content: "The only impossible journey is the one you never begin.",
            author: "Tony Robbins"
        },
        {
            content: "In this life we cannot do great things. We can only do small things with great love.",
            author: "Mother Teresa"
        },
        {
            content: "Only a life lived for others is a life worthwhile.",
            author: "Albert Einstein"
        },
        {
            content: "The purpose of our lives is to be happy.",
            author: "Dalai Lama"
        },
        {
            content: "Life is really simple, but we insist on making it complicated.",
            author: "Confucius"
        },
        {
            content: "May you live all the days of your life.",
            author: "Jonathan Swift"
        },
        {
            content: "Life itself is the most wonderful fairy tale.",
            author: "Hans Christian Andersen"
        },
        {
            content: "Do not let making a living prevent you from making a life.",
            author: "John Wooden"
        },
        {
            content: "Go confidently in the direction of your dreams! Live the life you've imagined.",
            author: "Henry David Thoreau"
        },
        {
            content: "The unexamined life is not worth living.",
            author: "Socrates"
        },
        {
            content: "The best way to predict the future is to create it.",
            author: "Peter Drucker"
        },
        {
            content: "The only way to do great work is to love what you do.",
            author: "Steve Jobs"
        },
        {
            content: "Innovation distinguishes between a leader and a follower.",
            author: "Steve Jobs"
        },
        {
            content: "Stay hungry, stay foolish.",
            author: "Steve Jobs"
        },
        {
            content: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
            author: "Steve Jobs"
        },
        {
            content: "The greatest wealth is to live content with little.",
            author: "Plato"
        },
        {
            content: "The journey of a thousand miles begins with one step.",
            author: "Lao Tzu"
        },
        {
            content: "That which does not kill us makes us stronger.",
            author: "Friedrich Nietzsche"
        },
        {
            content: "Be the change that you wish to see in the world.",
            author: "Mahatma Gandhi"
        },
        {
            content: "The only true wisdom is in knowing you know nothing.",
            author: "Socrates"
        },
        {
            content: "The mind is everything. What you think you become.",
            author: "Buddha"
        },
        {
            content: "I have not failed. I've just found 10,000 ways that won't work.",
            author: "Thomas Edison"
        },
        {
            content: "Whether you think you can or you think you can't, you're right.",
            author: "Henry Ford"
        },
        {
            content: "The secret of getting ahead is getting started.",
            author: "Mark Twain"
        },
        {
            content: "The two most important days in your life are the day you are born and the day you find out why.",
            author: "Mark Twain"
        },
        {
            content: "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.",
            author: "Mark Twain"
        },
        {
            content: "Great minds discuss ideas; average minds discuss events; small minds discuss people.",
            author: "Eleanor Roosevelt"
        },
        {
            content: "A person who never made a mistake never tried anything new.",
            author: "Albert Einstein"
        },
        {
            content: "Education is the most powerful weapon which you can use to change the world.",
            author: "Nelson Mandela"
        },
        {
            content: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
            author: "Nelson Mandela"
        },
        {
            content: "To handle yourself, use your head; to handle others, use your heart.",
            author: "Eleanor Roosevelt"
        },
        {
            content: "Too many of us are not living our dreams because we are living our fears.",
            author: "Les Brown"
        },
        {
            content: "Limitations live only in our minds. But if we use our imaginations, our possibilities become limitless.",
            author: "Jamie Paolinetti"
        },
        {
            content: "You become what you believe.",
            author: "Oprah Winfrey"
        },
        {
            content: "You can never cross the ocean until you have the courage to lose sight of the shore.",
            author: "Christopher Columbus"
        },
        {
            content: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
            author: "Maya Angelou"
        },
        {
            content: "Either you run the day, or the day runs you.",
            author: "Jim Rohn"
        },
        {
            content: "Life shrinks or expands in proportion to one's courage.",
            author: "Anaïs Nin"
        },
        {
            content: "If you want to lift yourself up, lift up someone else.",
            author: "Booker T. Washington"
        },
        {
            content: "Nothing is impossible, the word itself says 'I'm possible'!",
            author: "Audrey Hepburn"
        },
        {
            content: "The only way to achieve the impossible is to believe it is possible.",
            author: "Charles Kingsleigh"
        },
        {
            content: "The power of imagination makes us infinite.",
            author: "John Muir"
        },
        {
            content: "The man who moves a mountain begins by carrying away small stones.",
            author: "Confucius"
        }
    ];
}