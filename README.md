# MERN Real-Time Chat App

A full-stack real-time chat application built with MongoDB, Express, Node.js, Socket.IO, and a plain HTML/CSS/JavaScript frontend.

## Features

- User registration and login with JWT authentication
- Real-time one-to-one messaging with Socket.IO
- Online/offline user status
- Password visibility toggles
- Remember-me login behavior
- Gmail-based password reset flow
- Toast notifications for auth and chat actions
- File, image, and attachment sharing
- Image previews inside chat bubbles
- Download links for shared files
- Responsive login/register and chat UI

## Project Structure

```text
.
|-- backend/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- socket/
|   |-- utils/
|   |-- package.json
|   `-- server.js
|-- frontend/
|   |-- index.html
|   |-- script.js
|   `-- style.css
|-- vercel.json
`-- READ.md
```

## Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://devdatabase:devdatabase@chat-app.dvqcgpv.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Chat-App
JWT_SECRET=devkothari_super_secret_key_2025
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-google-app-password
MAIL_FROM="Chat App <your-gmail-address@gmail.com>"
```

Start the backend:

```bash
npm start
```

For local development with auto-restart:

```bash
npm run dev
```

Open:

```text
http://localhost:5000
```

## Environment Variables

| Key | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Backend port. Defaults to `5000`. |
| `MONGODB_URI` or `MONGO_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | Secret used to sign login tokens. |
| `CLIENT_URL` or `FRONTEND_URL` | Yes in production | Allowed frontend URL and reset-password link base URL. |
| `GMAIL_USER` | For password reset | Gmail account used to send reset emails. |
| `GMAIL_APP_PASSWORD` | For password reset | Google App Password, not your normal Gmail password. |
| `MAIL_FROM` | No | Sender label for password reset emails. |
| `DNS_SERVERS` | No | Optional DNS override for local MongoDB Atlas SRV lookup. |

## Gmail Password Reset

To use password reset emails:

1. Enable 2-Step Verification on your Google account.
2. Create a Google App Password.
3. Add the app password to `GMAIL_APP_PASSWORD`.
4. Use the same Gmail address for `GMAIL_USER` and `MAIL_FROM`.

Example:

```env
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASSWORD=your16characterapppassword
MAIL_FROM="Chat App <yourgmail@gmail.com>"
CLIENT_URL=https://your-frontend.vercel.app
```

## Attachment Sharing

The app supports sending:

- Images
- PDFs
- Documents
- Other files up to 10 MB

Uploaded files are stored in:

```text
backend/uploads/
```

This folder is ignored by Git.



## Deployment

### Frontend on Vercel

The root `vercel.json` routes the Vercel deployment to the static frontend files in `frontend/`.

### Backend on Render

Set these environment variables in the Render backend service:

```env
PORT=5000
MONGO_URI=mongodb+srv://devdatabase:devdatabase@chat-app.dvqcgpv.mongodb.net/chatapp?retryWrites=true&w=majority&appName=Chat-App
JWT_SECRET=devkothari_super_secret_key_2025
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-google-app-password
MAIL_FROM="Chat App <your-gmail-address@gmail.com>"
```

After changing environment variables, redeploy or restart the Render service.

## API Routes

### Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
GET  /api/users
```

### Messages

```text
GET  /api/messages/:userId
POST /api/messages/:userId
```

`POST /api/messages/:userId` accepts either JSON text messages or multipart form data with:

```text
text
attachment
```

## Useful Commands

Check backend syntax:

```bash
node --check backend/server.js
node --check backend/controllers/authController.js
node --check backend/controllers/messageController.js
node --check backend/middleware/auth.js
node --check backend/middleware/upload.js
```

Check frontend syntax:

```bash
node --check frontend/script.js
```

## Notes

- Never commit `.env` files.
- Rotate any secret that is accidentally shown in a screenshot or committed.
- Use a long random value for `JWT_SECRET`.
- Use a Gmail App Password for email sending.
