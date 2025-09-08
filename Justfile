build:
    bun run ./scripts/build.ts

dev:
    bun run ./scripts/build.ts --watch

zip: build
    rm -rf *.zip
    zip -r ukg-schedule-sync.zip manifest.json dist assets

lint:
    bun run lint
