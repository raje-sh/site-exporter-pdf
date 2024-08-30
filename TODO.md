## TODO

- [ ] prepare a demo video with non-wiki site https://stackoverflow.com/a/4279746/1092815
  - attach wiki-repo as example to main repo sub-module.
- [ ] optimize docker image size (last 7 layers are downloaded every new pull): puppeteer: 2.26GB, site-exporter: 2.6GB, inspect docker image layers
- [ ] allow setting a domain in cookie to allow muliti-site scraping
- [ ] remove base_url and allow base_url in links
- [ ] semver versioning, release-please config & auto-release, tag & update-package.json files.
- [ ] update github actions to update package version based on tags
- [ ] add e2e tests for js/css injections & output options