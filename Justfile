build:
    bun run ./scripts/build.ts

dev:
    bun run ./scripts/build.ts --watch

zip: build
    rm -rf *.zip
    python scripts/zip.py

lint:
    bun run lint
