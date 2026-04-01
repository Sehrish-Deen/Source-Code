# 🏋️ Fitness Tracker Application (MERN Stack)

A full-stack Fitness Tracker Web Application built using the MERN stack (MongoDB, Express.js, React.js, Node.js).  
This application helps users track workouts, monitor nutrition, and visualize fitness progress over time.

---

## 📌 Project Structure

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
- Nodemon
- Git & GitHub

---

## ✨ Features

### 👤 User Management
- User Registration & Login
- Email Verification
- Forgot & Reset Password
- Profile Management

---

### 🏋️ Fitness Tracking

#### Workout Tracking
- Add, Edit, Delete workouts
- Track sets, reps, weights
- Categorize workouts

#### Nutrition Tracking
- Log meals and calories
- Track macros

#### Progress Tracking
- Track weight & measurements
- Performance tracking
- Graph visualization

---

### 📊 Dashboard & Analytics
- Personalized dashboard
- Workout & nutrition analytics
- Charts and reports

---

### 🔔 Notifications
- Alerts & reminders
- Activity notifications

---

### 📱 Responsive Design
- Mobile-friendly UI

---

## 📸 Screenshots

### 🔐 Authentication
![Register](./screenshots/registrationform.png)
![Login](./screenshots/login.png)
![Email](./screenshots/email.png)
![Verified Email](./screenshots/verifiedemail.png)
![Forgot Password](./screenshots/forgotpassword.png)
![Check Email](./screenshots/checkemail.png)
![Reset Password](./screenshots/reset%20pass.png)
![Pass Reset](./screenshots/pass%20reset.png)

---

### 🖥 Dashboard
![Dashboard](./screenshots/Dashboard1.png)
![Dashboard](./screenshots/Dashboard2.png)
![Dashboard](./screenshots/Dashboard3.png)

---

### 👤 Profile & Settings
![Edit Profile](./screenshots/editprofile.png)
![Settings](./screenshots/Settings.png)

---

### 📊 Progress & Analytics
![Progress](./screenshots/progress.png)
![Weight](./screenshots/weight.png)
![Log Weight](./screenshots/logweight.png)
![Measurement](./screenshots/measurement.png)
![Performance](./screenshots/performance.png)
![Analytics](./screenshots/analytics.png)
![Chart](./screenshots/chart.png)

---

### 🏋️ Workouts & Nutrition
![Workout](./screenshots/workout.png)
![Workouts](./screenshots/workouts.png)
![Nutrition](./screenshots/nutrition.png)

---

### 📄 Reports & Notifications
![Report](./screenshots/report.png)
![Fitness Report](./screenshots/fitreport.png)
![Notification](./screenshots/notification.png)

---

### ✏️ Other
![Edited](./screenshots/edited.png)

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/Sehrish-Deen/Source-Code.git
2️⃣ Install Dependencies
Client
cd client
npm install
Server
cd server
npm install
3️⃣ Environment Variables

Note: .env file is ignored in .gitignore for security reasons.
After cloning the project, create a .env file inside the server/ folder with the following variables:

PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/fitnessTrackerDB
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
NODE_ENV=development

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

FRONTEND_URL=http://localhost:8080

Instructions:

Replace your_jwt_secret_key with a secure secret string.
Use Gmail App Password for EMAIL_PASS (do not use your real password).
Make sure MongoDB is running locally.
### 4️⃣ Run Project
Start Backend
cd server
nodemon server.js
Start Frontend
cd client
npm run dev
⚠️ Important Notes
.env and node_modules are ignored in .gitignore
Ensure MongoDB service is running locally
Install nodemon globally if not already installed:
npm install -g nodemon

### 👩‍💻 Developed By

Sehrish Deen
