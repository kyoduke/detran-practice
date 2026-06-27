# Detran RJ Exam Practice

Web app for practicing Detran RJ simulated exam questions.

The project includes:

- A Python scraper that fetches exam versions from the Detran RJ simulator and saves a JSON database.
- A React app that reads the JSON file and presents questions one at a time.
- Tailwind CSS for simple utility-based styling.
- Docker support that builds the Vite app and serves the output with nginx.

## Structure

```text
.
├── Dockerfile
├── docker-compose.yml
├── index.html
├── public/
│   ├── img/
│   └── detran_rj_exams.json
├── scripts/
│   └── detran_rj_scraper.py
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── questionPerformance.js
    ├── resultViewModels.js
    └── sessionSelection.js
```

## Run Locally

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

To build and preview the production output locally:

```bash
npm run build
npm run preview
```

## Generate The Question Database

Run the scraper from the project root:

```bash
python3 scripts/detran_rj_scraper.py
```

This creates or updates:

```text
public/detran_rj_exams.json
```

To write the JSON somewhere else, use:

```bash
python3 scripts/detran_rj_scraper.py --output path/to/file.json
```

## Run With Docker

```bash
docker compose up --build
```

Then open:

```text
http://localhost:8080
```

## App Behavior

The app shows one question at a time. After selecting an answer, click `Confirm` to reveal the result. The correct answer turns green, and an incorrect selected answer turns red.
