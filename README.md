# Commands

```bash
docker compose up -d
docker build -t wikijs-pdf-exporter:latest .
docker run -it --env-file ./.env -v ./out:/usr/src/app/out --cap-add=SYS_ADMIN --network="host" wikijs-pdf-exporter:latest;

act -W .github/workflows/publish.yml -e .act/publish.json
act -s DOCKERHUB_PAT -s DOCKERHUB_USERNAME --env-file .act/publish.env -j publish;



docker run -it -e SITE_BASE_URL=http://localhost:3000 -e PAGE_LINKS=$CS_LINKS -e SITE_COOKIES=jwt=$JWT_TOKEN --rm -v ./out:/usr/src/app/out --cap-add=SYS_ADMIN --network="host" rasuhcl/wikijs-pdf-export:latest
```

## TODO

- add result file name if single pdf
- allow injecting custom js script (usecase: replace link urls, view all tabs)
- add devcontainer & tasksfile
- use private image from dockerhub in local-wikijs
- https://github.com/ousmanedev/wikitopdf
- add env var validators (envalid)
- add build/lint/test scripts
- prep demo gif
- take age key backup or use third party keystore
- look for extracting sitemap using Wiki Api token

# Reference Links

- https://raslasarslas.medium.com/how-to-make-work-puppeteer-in-docker-both-in-local-en-prod-env-bb92628b2da6
- https://youtu.be/6cm6G78ZDmM?si=Gndf4Tkdw3CLsiTv

# Dev Tools

- Tasksfile
- act
- Node
- Docker
