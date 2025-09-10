# Deploy

- Ensure the version is updated in `manifest.json` and `package.json`.
- Run:

```shell
just zip

VERSION=vX.Y.Z
git tag ${VERSION}
git push --tags
gh release create ${VERSION} *.zip
```
