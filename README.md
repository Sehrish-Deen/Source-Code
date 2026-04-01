# 🏋️ Fitness Tracker Application (MERN Stack)

A full-stack Fitness Tracker Web Application built using the MERN stack (MongoDB, Express.js, React.js, Node.js).  
This application allows users to track workouts, monitor nutrition, and visualize fitness progress over time.

---

## 📌 Project Structure

The project is divided into two main directories:

- **client/** → Frontend (React.js)
- **server/** → Backend (Node.js, Express.js, MongoDB)

---

## 🚀 Technologies Used

### Frontend
- React.js
- Tailwind CSS
- Axios
- Framer Motion

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

### Tools
- Nodemon (for automatic server restart)
- Git & GitHub

---

## ✨ Features

### 👤 User Management
- User Registration with profile details
- Secure Login Authentication
- Profile Update (name, email, profile picture)

---

### 🏋️ Fitness Tracking

#### Workout Tracking
- Create, edit, and delete workout routines
- Track sets, reps, weights, and notes
- Categorize workouts (e.g., strength, cardio)

#### Nutrition Tracking
- Log daily meals (breakfast, lunch, dinner, snacks)
- Track calories and macronutrients

#### Progress Tracking
- Track weight and body measurements
- Record performance metrics
- Visualize progress with charts

---

### 📊 Dashboard & Analytics
- Personalized dashboard overview
- Workout history and analytics
- Nutrition insights (calories & macros)

---

### 🔔 Notifications & Alerts
- Workout reminders
- Goal achievement notifications

---

### 🔍 Search & Filtering
- Search workouts and nutrition entries
- Apply filters for better results

---

### 📱 Responsive Design
- Fully responsive across mobile, tablet, and desktop

---

## 📸 Screenshots

### Dashboard
![Dashboard](./screenshots/Dashboard1.png)
![Dashboard](./screenshots/Dashboard2.png)
![Dashboard](./screenshots/Dashboard3.png)

### Progress Tracking
![Progress](./screenshots/progress.png)

### Workout Page
![Workout](./screenshots/workout.png)

### Authentication (Login / Signup)
![Auth](./screenshots/auth.png)

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/Sehrish-Deen/Source-Code.git
2️⃣ Install Dependencies
Client (Frontend)
cd client
npm install
Server (Backend)
cd server
npm install
3️⃣ Environment Variables

Create a .env file inside the server/ folder:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
4️⃣ Run the Project
Start Backend Server
cd server
nodemon server.js
Start Frontend Client
cd client
npm run dev
⚠️ Important Notes
.env and node_modules are ignored using .gitignore
Make sure MongoDB is running before starting the server
Install nodemon globally if not installed:
npm install -g nodemon
📁 Folder Structure
Source-Code/
│
├── client/
│   ├── src/
│   ├── components/
│   └── pages/
│
├── server/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   └── server.js
│
├── screenshots/
│   ├── dashboard.png
│   ├── progress.png
│   ├── workout.png
│   └── auth.png
🔮 Future Improvements
AI-based fitness recommendations
Social features (followers, sharing progress)
Mobile application version
Advanced analytics and reports
👩‍💻 Developed By

Sehrish Deen
