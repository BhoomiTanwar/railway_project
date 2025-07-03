# 🚂 Railway Management System API

A secure, RESTful Railway Reservation System built using Node.js, Express, and PostgreSQL. This API supports user registration, login, train management, and seat booking, with role-based access control for admin functionality.

---

 📁 Project Structure
🧪 Features

- ✅ User Registration & Login with hashed passwords
- 🔐 JWT-based Authentication
- 🛡️ Admin-only endpoints secured via API Key
- 🚆 Add, update, and check seat availability for trains
- 🎟 Book and view confirmed train tickets
- ⚙️ PostgreSQL-backed schema with constraints and triggers
- 🧾 Input validation with `Joi`
- 🧱 Rate limiting & Helmet for basic API security
  
1. Clone the repository
bash
->git clone https://github.com/your-username/railway-management-api.git
->cd railway-management-api
2. Install dependencies
   npm install
3. Configure environment variables
   Create a .env file in the root directory:
   PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=railway_management
DB_USER=your_db_user
DB_PASSWORD=#######(write your own password)

4. Set up the PostgreSQL database
Make sure PostgreSQL is installed and running.

Create the database manually:
psql -U postgres
CREATE DATABASE railway_management;
\q
Then run the SQL schema:
psql -U postgres -d railway_management -f database/schema.sql

