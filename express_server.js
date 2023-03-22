const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser'); 

// Global Objects 
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userA: {
    id: "userA",
    email: "a@a.com",
    password: "1234",
  },
  userB: {
    id: "userB",
    email: "b@b.com",
    password: "1234",
  },
};

//
// Helper Functions
//
const generateRandomString = function() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}; 

// function to get user id by email 
const getUserByEmail = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null; 
}

// Middleware 
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 



//
// Routes 
//
app.get("/", (req, res) => {
  res.redirect("/urls");
})

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    users: req.cookies["users"],
    username: req.cookies.username // [email]
  };
  res.render("urls_index", templateVars);
}); 

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    users: req.cookies["users"],
    username: req.cookies.username
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
  const userId = req.cookies["username"]
  const templateVars = { 
    id,
    longURL: urlDatabase[id],
    shortURL: id,
    users,
    username: users[userId]["email"]  
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
  
  if(users[id] === "" || users[id]["password"] === ""){
    return res.status(400).send('Please enter a username and password.')
  }

  // function that searches through user object and checks if email already exists 
  if (getUserByEmail(req.body.email)) {
    return res.status(400).send('That username is not available.')
  }  
  
  res.cookie('username', req.body.email); // set user id as cookie 
  // console.log('users', users);                 // debugging 
  // console.log('user_id cookie', req.body.email)  // debugging
  
  return res.redirect("/urls");

});





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

