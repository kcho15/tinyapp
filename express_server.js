const express = require("express");
const app = express();
const PORT = 8080; // default port 8080 // 8081 for testing when nodemon crashes!
const cookieSession = require('cookie-session');
const helpers = require('./helpers');
const bcrypt = require('bcryptjs');

// Global Objects
const urlDatabase = {
  "aJ481W": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "userA",
  },
  "afgghd": {
    longURL: "http://www.google.com",
    userId: "userB"
  },
  "sgq3y6": {
    longURL: "http://www.google.com",
    userId: "userC"
  }
};
  
const users = {
  userA: {
    id: "userA",
    email: "a@a.com",
    password: "$2a$10$H5dxMo5PG6AOPHEfRMR.5uTpiIs3ZjqQ6Va.7l8vTjfJKBKpJXkuS", // Test p/w "1234"
  },
  userB: {
    id: "userB",
    email: "b@b.com",
    password: "$2a$10$H5dxMo5PG6AOPHEfRMR.5uTpiIs3ZjqQ6Va.7l8vTjfJKBKpJXkuS", // Test p/w "1234"
  },
};

// Helper Functions
// random string generator function
const generateRandomString = function() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// function which returns the URLs where the userId is equal to the id of the currently logged-in user
const urlsForUser = function(id) {
  let result = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userId === id) { // id being the cookie value
      //return urlDatabase[user].longURL;
      result[key] = {
        longURL: urlDatabase[key].longURL
      };
    }
  }
  return result;
};

// Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["secret"],
}));



// Routes

// Home page
app.get("/", (req, res) => {
  res.redirect("/login");
});

// GET /urls
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;

  // check if user has cookie
  if (!userId) {
    return res.status(401).send('<h1>401 Unauthorized. Please login or register.</h1>');
  }

  // happy path - user is logged in, user can access own urls
  const user = users[userId];
  const userURLs = urlsForUser(userId);

  // render the page
  const templateVars = {
    urls: userURLs,
    user: user
  };

  res.render("urls_index", templateVars);
});

// GET urls/new
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;

  // redirect to /login if no cookie exists (not logged in)
  if (!userId) {
    return res.redirect("/login");
  }
  
  // happy path - user is logged in, render page
  const user = users[userId];
  const templateVars = {
    user: user
  };

  res.render("urls_new", templateVars);
});

// POST /url
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;

  // users not logged in cannot add urls to database
  if (!userId) {
    return res.status(401).send('<h1>Access Denied! Register or log in to use TinyApp!</h1>');
  }

  // happy path - save the url submission
  const savedLongURL = req.body.longURL.trim();   // Save the long URL entered by the user
  const shortURL = generateRandomString();        // Generate new short url
  urlDatabase[shortURL] = {
    longURL: savedLongURL,
    userId,
  };

  res.redirect(`/urls/${shortURL}`); // Redirect the user to the show page for the new URL
});

// GET /u/:id - Route handler that redirects shortURL's generated and saved to the longURL
app.get("/u/:id", (req, res) => {
  const userId = req.session.user_id;

  // if not logged in, no access to this page
  if (!userId) {
    return res.status(401).send('<h1>Access Denied! Register or log in to use TinyApp!</h1>');
  }

  const shortURL = req.params.id;                 // assign the id parameter from the request URL to variable
  const longURL = urlDatabase[shortURL].longURL;  // Use the shortURL key in the urlDatabase to look up longURL value
  
  // if the longURL does not exist (shortURL key is invalid)
  if (!longURL) {
    return res.status(404).send('<h1>404 Page Not Found</h1>');
  }

  res.redirect(longURL);
});

// GET /urls/:id
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userId = req.session.user_id;
  const url = urlDatabase[id];

  // if not logged in, no access to urls
  if (!userId || (!url || url.userId !== userId)) {
    return res.status(401).send('<h1>Access Denied!</h1>');
  }

  // happy path - render page
  const user = users[userId];
  const longURL = urlDatabase[id].longURL;

  const templateVars = {
    id: id,
    longURL,
    user: users[userId]
  };

  res.render("urls_show", templateVars);
});

// POST 'Delete' Route
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userId = req.session.user_id;
  const url = urlDatabase[id];
  
  // if url does not exist
  if (!url) {
    return res.status(400).send('<h1>URL not found!</h1>');
  }

  // if user does not own url
  if (url.userId !== userId) {
    return res.status(401).send('<h1>Access Denied! User does not own URL!</h1>');
  }
  
  delete urlDatabase[id];
  res.redirect("/urls");
});

// POST 'Edit' Route
app.post("/urls/:id/edit", (req,res) => {
  const id = req.params.id;
  const userId = req.session.user_id;
  const url = urlDatabase[id];
  
  // if not logged in, no access to urls
  if (!userId) {
    return res.status(401).send('<h1>Access Denied!</h1>');
  }

  // if url exists but userId does not match, no access
  if (url && url.userId !== userId) {
    return res.status(401).send('<h1>Access Denied!</h1>');
  }

  urlDatabase[id] = {
    longURL: req.body.edit,
    userId,
  };

  res.redirect("/urls");
});

// GET 'Login' Route
app.get("/login", (req, res) => {
  const email = req.body.email;
  const userId = req.session.user_id;
  const user = users[userId];
  
  // if logged in already, redirect to /urls
  if (userId) {
    return res.redirect("/urls");
  }
  
  const templateVars = {
    user,
    username: email
  };
  
  res.render("login", templateVars);
  
});

// POST 'Login' Route
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = helpers.getUserByEmail(email, users);
  
  if (!user) {
    return res.status(403).send('Please enter a valid username and password.');
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('Please enter a valid username and password.');
  }

  // set cookie to "id" property of user
  req.session.user_id = user.id;
  return res.redirect("/urls");
});
    
// POST 'Log out' Route
app.post("/logout", (req, res) => {
  
  // delete cookie session
  req.session = null;
  res.redirect("/login");
});

// GET 'Register' Route
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  
  // if logged in already, redirect to /urls
  if (userId) {
    return res.redirect("/urls");
  }

  res.render("register", {user: null});
});
  
// POST 'Register' Route
app.post("/register", (req, res) => {
  const email = req.body.email;
  
  // password hash-er
  const password = req.body.password;
  const salt = bcrypt.genSaltSync();
  const hash = bcrypt.hashSync(password, salt);
   
  if (!email || !password) {
    return res.status(400).send('Please enter a username and password.');
  }
  const userFound = helpers.getUserByEmail(email, users);
  
  if (userFound) {
    return res.status(400).send('That username is not available.');
  }
  
  // assigning a new user a random string as an ID, populate their registration email and password
  let id = generateRandomString();
  users[id] = {
    id,
    email,
    password: hash,
  };
   
  // Setting cookie to id
  req.session.user_id = id;
  console.log('id, cookie', id);
  return res.redirect("/urls");
});

// Server on
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

 