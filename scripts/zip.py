#!/usr/bin/env python3
import json
from pathlib import Path
import zipfile

PACKAGE_JSON_PATH = Path("package.json")
ZIP_INCLUDE = [
    "manifest.json",
    "assets",
    "dist",
]


def main() -> None:
    with PACKAGE_JSON_PATH.open() as f:
        version: str = json.load(f)["version"]

    zip_name = f"ukg-schedule-sync_v{version}.zip"
    with zipfile.ZipFile(zip_name, "w", zipfile.ZIP_DEFLATED) as zf:
        for name in ZIP_INCLUDE:
            p = Path(name)
            if p.is_file():
                print(">", p)
                zf.write(p)
            else:
                for root, _dirs, files in p.walk():
                    for file in files:
                        p = root / file
                        print(">", p)
                        zf.write(p)

    print(zip_name)


if __name__ == "__main__":
    main()
