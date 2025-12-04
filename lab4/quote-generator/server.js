const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Sample quotes dataset (in-memory)
const quotes = [
  { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { id: 2, text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { id: 3, text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { id: 4, text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
];

let favorites = [];

// Get random quote
app.get('/quote', (req, res) => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  res.json(quotes[randomIndex]);
});

// Get all favorite quotes
app.get('/favorites', (req, res) => {
  res.json(favorites);
});

// Add a quote to favorites
app.post('/favorites', (req, res) => {
  const quote = req.body;
  // Check if the quote is already in favorites by its ID
  if (!favorites.find(fav => fav.id === quote.id)) {
    favorites.push(quote);
    res.json(quote);
  } else {
    res.status(400).json({ error: "Quote already in favorites" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});