# Wordly Blogging App

## Overview

Wordly is a blogging web application that allows users to create, share, and interact with blogs online.
The platform allows people to discover blogs, connect with bloggers, and share ideas with others.

Users can create accounts, log in, write posts, and explore content created by other bloggers.

---

## Features

The application includes the following features:

* User registration and login
* Google authentication using Firebase
* Create and publish blog posts
* View blogs from other users
* Follow and interact with bloggers
* Search for blogs or bloggers
* User profile management

---

## Technologies Used

This project was built using modern web technologies:

* **React.js** – Frontend user interface
* **Firebase Authentication** – User login and security
* **Firestore Database** – Storing user and blog data
* **CSS** – Styling and responsive layout
* **React Router** – Page navigation
* **Git & GitHub** – Version control and project management

---

## Project Structure

The main folders in the project include:

```
src/
 ├── components/       # Reusable UI components
 ├── pages/            # Application pages
 ├── Firebase/         # Firebase configuration
 ├── Pagescss/         # CSS styling files
 └── App.js            # Main application file
```

---

## Installation

To run the project locally:

1. Clone the repository

```
git clone https://github.com/yourusername/wordly-blog-app.git
```

2. Navigate into the project folder

```
cd wordly-blog-app
```

3. Install dependencies

```
npm install
```

4. Start the development server

```
npm start
```

The application will run on:

```
http://localhost:3000
```

---

## Firebase Setup

To use authentication and database features:

1. Create a Firebase project
2. Enable **Authentication**
3. Enable **Firestore Database**
4. Add your Firebase configuration to the project

Example:

```
src/Firebase/Firebase.js
```

---

## Future Improvements

Some improvements planned for the future:

* Settings
* User profile customization
* Notifications system
* Dark mode

---

## Author

**Rotondwa Rambau**

Diploma in ICT – App Dev

---

## License

This project is for educational purposes and personal development.
