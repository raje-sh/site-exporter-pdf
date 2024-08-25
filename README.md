## Demo

<!-- <video src="./example/js-exporter-demo.mov" width="1280" height="720" controls onloadstart="this.playbackRate = 1.5;"></video> -->

## TODO

- prep readme.md with usage instructions
  - problem with inline js content `${env-var-issue}`
- alter commiter account
- prep demo video with non-wiki site https://stackoverflow.com/a/4279746/1092815
  - attach wiki-repo as example to main repo sub-module.
- add debug mode logs
- investigate why not working in codespaces
- update github actions to update package version based on tags
- optimize docker image size (current: last 7 layers are downloaded every new version pull)
- change repo-name in issue-templates
- semver versioning
- --cap-add=SYS_ADMIN => Needed since no-sandbox flag enabled?
- allow margin customization  'top right bottom left'

## Running the image

```bash
docker run -it --rm --cap-add=SYS_ADMIN -v ./config.yml:/usr/src/app/config.yml -v ./out:/usr/src/app/out ghcr.io/rajesh-sundaram-hcl/site-pdf-exporter:latest

docker run -it --rm -v ./config.yml:/usr/src/app/config.yml -v ./out:/usr/src/app/out ghcr.io/rajesh-sundaram-hcl/site-pdf-exporter:latest
```
- `--cap-add=SYS_ADMIN` capability is needed to enable Chrome sandbox that makes the browser more secure. 
- `--network="host"` is needed when the target site is running on the same host as the Docker container.

# Reference Links

- https://raslasarslas.medium.com/how-to-make-work-puppeteer-in-docker-both-in-local-en-prod-env-bb92628b2da6
- https://youtu.be/6cm6G78ZDmM?si=Gndf4Tkdw3CLsiTv
