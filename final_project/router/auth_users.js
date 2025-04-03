const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [
    { username: "testuser", password: "password123" } // Example user
];

const SECRET_KEY = "fingerprint_customer"; // Define the secret key

// Check if username is valid (i.e., not already taken)
const isValid = (username) => {
    return users.some(user => user.username === username);
};

// Authenticate user (check if username and password match records)
const authenticatedUser = (username, password) => {
    return users.find(user => user.username === username && user.password === password);
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    const user = authenticatedUser(username, password); // Get user object
    if (!user) {
        return res.status(401).json({ message: "Invalid username or password." });
    }

    // Generate JWT Token
    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: "1h" });

    req.session.token = token; // Store in session

    return res.status(200).json({ message: "Login successful!", token });
});

// Add or update a book review (only for authenticated users)
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const { review } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY); // Verify token
        const username = decoded.username;

        if (!books[isbn]) {
            return res.status(404).json({ message: "Book not found." });
        }

        if (!books[isbn].reviews) {
            books[isbn].reviews = {};
        }

        books[isbn].reviews[username] = review; // Add or update the review

        return res.status(200).json({ message: "Review added/updated successfully!", reviews: books[isbn].reviews });
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
