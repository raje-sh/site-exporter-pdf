# AGE & SopS Secret Encryption

## SOPS & AGE Setup

```bash
mkdir -p ~/.age
age-keygen -o ~/.age/age.key
export SOPS_AGE_KEY_FILE="$HOME/.age/age.key"
```

`Note`: SOPS KEY File will be available in personal GDrive

## Edit Environment Vars

```bash
sops --input-type dotenv --output-type dotenv edit sops.env
```

## Gen Sops From .env file (mostly won't be needed, as the sops file already exists)

For any changes to env files, do directly using sops edit cli.

```bash
sops --output-type dotenv -e .env > sops.env
```

## TODO

- Generate Site URLS from PG DB
- USE URLS to navigate and record via pupeeteer.
