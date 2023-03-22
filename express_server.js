const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser'); 
  
const generateRandomString = function() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}; 


// Middleware 
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 

// Global Objects 
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userA: {
    id: "randomA",
    email: "a@a.com",
    password: "1234",
  },
  userB: {
    id: "randomB",
    email: "b@b.com",
    password: "1234",
  },
};


//
// Routes 
//
app.get("/", (req, res) => {
  res.redirect("/urls");
})

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);
}); 

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
  };  
  res.render("urls_new", templateVars);
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
  const id = req.params.id; // assigned req.params.id to a variable IDs
  const username = req.cookies["username"]
  const templateVars = { 
    id,
    longURL: urlDatabase[id],
    shortURL: id,
    username
  }; 
  res.render("urls_show", templateVars);
});

//
// 'Edit' Route
//
app.post("/urls/:id/edit", (req,res) => {
  urlDatabase[req.params.id] = req.body.edit; 
  res.redirect("/urls");
});

// 
// 'Delete' Route
//
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];      
  res.redirect("/urls");
});

//
// 'Login' Route
//
app.post("/login", (req, res) => {      
  const username = req.body.username;  // save the username entered in the submission req.body
  res.cookie("username", username);   // set a cookie to store username, name and value is username variable 
  res.redirect("/urls");          // redirect back to urls page
});

//
// 'Log out' Route
//
app.post("/logout", (req, res) => {
  const username = req.body.username;
  res.clearCookie("username")
  res.redirect("/urls");
})

//
// 'Register' Route
//
// GET - render the page
app.get("/register", (req, res) => {
  
  return res.render("register", {username: null});
});

// POST - user inputs registration items 
app.post("/register", (req, res) => {
  // assigning a new user a random string as an ID, populate their registration email and password
  let id = generateRandomString();
  users[id] = {
    id,
    email: req.body.email,
    password: req.body.password
  };
 
  res.cookie('user_id', users[id].id); // set user id as cookie 
  // console.log('users', users);                 // debugging 
  // console.log('user_id cookie', users[id].id)  // debugging
  
  return res.redirect("/register");

});





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

