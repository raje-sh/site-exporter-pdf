# Commands

```bash
docker compose up -d
docker build -t wikijs-pdf-exporter:latest .
docker run -it --env-file ./.env -v ./out:/usr/src/app/out --cap-add=SYS_ADMIN --network="host" wikijs-pdf-exporter:latest;
```

## TODO

- Add GitHubActions & Publish Image to Docker Registry
- https://github.com/ousmanedev/wikitopdf
- add env var validators

# Reference Links

- https://raslasarslas.medium.com/how-to-make-work-puppeteer-in-docker-both-in-local-en-prod-env-bb92628b2da6
- https://youtu.be/6cm6G78ZDmM?si=Gndf4Tkdw3CLsiTv
