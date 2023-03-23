const express = require("express");
const app = express();
const PORT = 8081; // default port 8080
const cookieParser = require('cookie-parser'); 

// Global Objects 
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ481W",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID:"aJ481W"
  },

}; 

const users = {
  userA: {
    id: "userA",
    email: "a@a.com",
    password: "1234",
    
    
    // urls: "urls", 
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

// function which returns the URLs where the userID is equal to the id of the currently logged-in user
const urlsForUser = function (id) {
  let result = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === id) { // id being the cookie value
      //return urlDatabase[user].longURL; 
      result[key] = { 
        longURL: urlDatabase[key].longURL
      }
    } 
  }
  return result;
};

// Middleware 
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 



//
// Routes 
//
app.get("/", (req, res) => {
  res.redirect("/login");
});

// GET /urls
app.get("/urls", (req, res) => {
  const email = req.body.email;
  const userId = req.cookies["userId"];

  if (!userId) {
    return res.redirect("/login"); 
  } 
  const user = users[userId]; 
  // console.log('user', user)     // debugging 
  
  // if not correct user, do no render other urls 
  let userURLs = urlsForUser(userId);
  // generate the specific user's urls for rendering 
  console.log('userURLs', userURLs)
  // console.log('req.body.longURL', req.body.longURL) // debugging 
  // const userURLs = req.body.longURL; // undefined 

  const templateVars = { 
                      // missing something here or in urls_index 
      urls: userURLs, 
      user: user      // undefined error?? 
    };

  console.log('urls', urlsForUser) // debugging 
  res.render("urls_index", templateVars);
}); 

// GET urls/new 
app.get("/urls/new", (req, res) => {  
  
  const email = req.body.email;
  const userId = req.cookies["userId"];
  
  if (!userId) {  // redirect to /login if no cookie (not logged in)
    return res.redirect("/login")
  }
  
  const user = users[userId];
  const templateVars = { 
    user: user
  };  
  res.render("urls_new", templateVars);
});

// POST url route (after the new url has been entered)
app.post("/urls", (req, res) => {
  // const email = req.body.email;
  const userId = req.cookies["userId"];
  
  if (!userId) {  // users not logged in cannot add urls to database 
    return res.status(401).send('Access Denied! Register or log in to use TinyApp!') 
  }
  const savedLongURL = req.body.longURL.trim(); // Save the long URL entered by the user
  const shortURL = generateRandomString(); // Generate new short url 
  urlDatabase[shortURL] = { 
      longURL: savedLongURL, 
      userID: userId 
  }; // Save the two as key-value pair to the urlDatabase object 
  res.redirect(`/urls/${shortURL}`); // Redirect the user to the show page for the new URL
});

// GET /u/:id - Route handler that redirects shortURL's generated and saved to the longURL 
app.get("/u/:id", (req, res) => {
  
  const userId = req.cookies["userId"];
  const shortURL = req.params.id; // assign the id parameter from the request URL to variable
  const longURL = urlDatabase[shortURL].longURL; // Use the shortURL key in the urlDatabase to look up longURL value 
  
  if (!longURL) {     // if the longURL does not exist (shortURL key is invalid)
    return res.status(404).send('<h1>404 Page Not Found</h1>');
  }
    res.redirect(longURL);
});

// GET /urls/:id
app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["userId"]; // this will change to req.session.user_id 
  const user = users[userId];
  const id = req.params.id; // keep this 
  const longURL = urlDatabase[id].longURL;  

  const templateVars = { 
    id: id,
    longURL,     // 
    user: user      // this will change to users[req.session.userId]
  }; 
  res.render("urls_show", templateVars);
});


// POST 'Edit' Route
app.post("/urls/:id/edit", (req,res) => {
  urlDatabase[req.params.id].longURL = req.body.edit;  // changed to longURL
  res.redirect("/urls");
});

// POST 'Delete' Route
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];      
  res.redirect("/urls");
});

// GET 'Login' Route
app.get("/login", (req, res) => {
  const email = req.body.email;
  const userId = req.cookies["userId"];
  const user = users[userId];

  // if logged in already, redirect to /urls
  if (userId) {
    return res.redirect("/urls");
  }

  const templateVars = { 
    user,
    username: email
  };

  res.render("login", templateVars)

});

// POST 'Login' Route
app.post("/login", (req, res) => {      
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);

  if (!user || user.password !== password) {
    return res.status(403).send('Please enter a valid username and password.') 
  }
      
  const userId = user.id;          // save the email entered in the submission req.body
    res.cookie("userId", userId);  // set a cookie to store email 
    return res.redirect("/urls");  // redirect back to urls page         
});

// POST 'Log out' Route
app.post("/logout", (req, res) => {
  
  res.clearCookie("userId")
  res.redirect("/login");
});

// GET 'Register' Route
app.get("/register", (req, res) => {
  const email = req.body.email;
  const userId = req.cookies["userId"];
  const user = users[userId];

  // if logged in already, redirect to /urls
  if (userId) {
    return res.redirect("/urls");
  }  
  res.render("register", {user: null});
});

// POST 'Register' Route - user inputs registration items 
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  if (!email || !password) {
     return res.status(400).send('Please enter a username and password.')
  } 
  const userFound = getUserByEmail(email); 
 
  if (userFound) {
    // console.log('get user fn', userFound);    // debugging 
    // console.log('users', users);              // debugging 
    return res.status(400).send('That username is not available.')
  }  
  
  // assigning a new user a random string as an ID, populate their registration email and password
  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password,
  };
  
  res.cookie('userId', id); // set user id as cookie 
  // console.log('user_id cookie', req.body.email)  // debugging
  
  return res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

