# Domaris

This repository contains the source code for the Domaris application, managed as an Nx workspace.

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (Package Manager)
- **Docker** (For the database)

## Getting Started

### 1. Install Dependencies

Install the project dependencies using pnpm:

```bash
pnpm install
```

### 2. Configure Environment

Set up the environment variables for the backend. You can start by copying the example configuration:

```bash
cp backend/.example.env backend/.env
```

Review `backend/.env` and adjust any values if necessary.

### 3. Create the Database

The application requires a PostgreSQL database. You can start a local instance using Docker.

Run the following command to create and start the `domaris-postgres` container (matches default `.env` credentials):

```bash
docker run --name domaris-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=domino \
  -p 5432:5432 \
  -d postgres
```

> **Note:** The backend is configured to synchronize entities with the database on startup, so tables will be created automatically.

### 4. Run the Applications

You can run the backend and frontend separately or together.

#### Backend

Start the NestJS backend:

```bash
npx nx serve @domaris/backend
```

The API will be available at `http://localhost:3000` (or the port specified in your env).

#### Frontend

Start the React frontend:

```bash
npx nx serve @domaris/frontend
```

The application will be available at `http://localhost:4200`.

## Additional Nx Commands

- **Build**: `npx nx build <project-name>`
- **Test**: `npx nx test <project-name>`
- **Graph**: `npx nx graph` to visualize the project dependencies.

For more information on Nx, visit [nx.dev](https://nx.dev).
