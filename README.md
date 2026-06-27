# Detran RJ Exam Practice

Small static web app for practicing Detran RJ simulated exam questions.

The project includes:

- A Python scraper that fetches exam versions from the Detran RJ simulator and saves a JSON database.
- A static HTML/CSS/JS app that reads the JSON file and presents questions one at a time.
- Docker support using nginx to serve the static files.

## Structure

```text
.
├── Dockerfile
├── docker-compose.yml
├── scripts/
│   └── detran_rj_scraper.py
└── static/
    ├── index.html
    ├── styles.css
    ├── app.js
    └── detran_rj_exams.json
```

## Generate The Question Database

Run the scraper from the project root:

```bash
python3 scripts/detran_rj_scraper.py
```

This creates or updates:

```text
static/detran_rj_exams.json
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
