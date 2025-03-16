const express = require("express");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const chalk = require("chalk");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const User = require("./src/models/User");

const mongoose = require("mongoose");
const passport = require("passport")
var GoogleStrategy = require("passport-google-oauth20").Strategy;


dotenv.config();
const app = express();
const PORT = 6000;

// HTTP Server and Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*" , // Frontend origins
    methods: ["GET", "POST"],
  },
});

const corsOptions = {
  origin: "*", // Add both URLs here
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

// MongoDB connection
const mongoDb = mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));



// Middleware

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");




app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/dashboard", "index.html"));
});


// Socket.io connection
io.on("connection", async (socket) => {

   console.log("Socket connected")
 

  socket.on("message-client", (msg) => {
    console.log(chalk.blue(msg));
  });

  
let User_id = ""; // গ্লোবাল ভেরিয়েবল

socket.on("user-id", async (userId) => {
  User_id = userId; // এখানে সেট করা হয়েছে

  try {
    const User_data = await User.findById(User_id);
    if (User_data) {
     
      socket.emit("user-data" , User_data)

    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error fetching user:", error);
  }

  console.log("Stored User ID:", User_id); // এখন এটি ঠিকভাবে দেখাবে
});



  try {
    const totalUsers = await User.estimatedDocumentCount();
    socket.emit("total-users", totalUsers);
  } catch (error) {
    console.error(error);
  }

  socket.emit("message", "Hello World from server");
});

// Routes
// Home Route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// Registration Route
app.post("/register", async (req, res) => {
  const { name, email, password, mobile } = req.body;

  if (!name || !email || !password || !mobile) {
    return res.status(400).json({ msg: "Please fill all fields" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, mobile });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Redirect to dashboard with token
    res.status(201).json({ msg: "User Created Successfully", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
});


// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials!' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });

    const user_id = user._id;
    const user_email = user.email;

    // Send user data and token
    return res.json({
      success: true,
      user_id,
      user_email,
      token, // You may also want to send a JWT token here to manage authentication in future requests
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong!', error });
  }
});

// Get total users
app.get("/total-users", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.status(200).json({ totalUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
});




passport.use(
  new GoogleStrategy(
    {
      clientID:
        "769426348804-i4nio8fbqhhojal06m76hqu8r93uaqno.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://www.kivicoin.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
          });
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Add this to your Express app (server.js or routes/auth.js)


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:3000/login',
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000?token=${token}`);
  }
);


// Server listening

module.exports = server;
