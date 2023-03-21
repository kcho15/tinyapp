const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
  
const generateRandomString = function() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}; 

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
}); 

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const savedLongURL = req.body.longURL; // Save the long URL entered by the user
  const savedShortURL = generateRandomString(); // Generate new short url 
  urlDatabase[savedShortURL] = savedLongURL; // Save the two as key-value pair to the urlDatabase object 
  res.redirect(`/urls/${savedShortURL}`); // Redirect the user to the show page for the new URL
});

// Route handler that redirects shortURL's generated and saved to the longURL 
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id; // assign the id parameter from the request URL to variable 
  const longURL = urlDatabase[shortURL]; // Use the shortURL key in the urlDatabase to look up longURL value 
  res.redirect(longURL);
});
 
app.get("/urls/:id", (req, res) => {
  const IDs = req.params.id; // assigned req.params.id to a variable IDs
  const templateVars = { id: IDs, longURL: urlDatabase[IDs], shortURL: generateRandomString() }; 
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

