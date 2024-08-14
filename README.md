# Commands

```bash
docker compose up -d
docker build -t wikijs-pdf-exporter:latest .
docker run -it --cap-add=SYS_ADMIN --network="host" wikijs-pdf-exporter:latest;
```

## TODO

- Add Chromium to the Docker Image
- accept node script to take URL's List (don't generate sitemap: Single Responsibility)
- Add GitHubActions & Publish Image to Docker Registry
- Merge PDF Files In the Sequence
- https://github.com/ousmanedev/wikitopdf
