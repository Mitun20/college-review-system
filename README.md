# College Review System

A REST API for managing colleges and student reviews, built with Node.js, Express, MongoDB, and Mongoose.

## Features

- User registration and login
- JWT authentication
- Role-based access control: admin, teacher, and student
- College CRUD operations
- Review CRUD operations and ownership checks
- Review pagination, filtering, and comment search
- College average-rating and review-count aggregation
- Request validation using Joi
- Automated tests using Jest and Supertest

## Requirements

- Node.js and npm
- MongoDB, locally or through Docker

## Installation

Clone or navigate to the project directory, then install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root and configure the required variables, including your MongoDB connection string and JWT secret. Check your application code for the exact variable names.

## Run the Application

Start the development server:

```bash
npm run dev
```

## Run Tests

Run the automated test suite:

```bash
npm test
```

## API Routes

- `/api/auth` — registration and login
- `/api/colleges` — college management
- `/api/reviews` — review management

Use a tool such as Postman or curl to test the API endpoints. Protected endpoints require a valid JWT access token.

## Technologies

- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- Joi
- Jest
- Supertest
