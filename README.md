# Web Page to PDF Converter

This application converts web page links into PDF documents and is designed for seamless usage via Docker.

<!-- TODO -->
<!-- <video src="./example/js-exporter-demo.mov" width="1280" height="720" controls onloadstart="this.playbackRate = 1.5;"></video> -->

## Features

- Converts any web page link to a PDF document.
- Easy to run using Docker.
- Configurable options via a YAML file.

## Prerequisites

- Docker installed on your machine.

## Getting Started

### 1. Prepare Directories and Configuration

Create the necessary directories and configuration file on your host machine:

- `Configuration File`: Create a `config.yml` file with your desired settings.
- `Output Directory`: Create an out directory where the generated PDFs will be saved.

### 2. Run the Docker Container

Execute the following command to start the application:

```bash
docker run -it --rm -v ./config.yml:/app/config.yml -v ./out:/app/out ghcr.io/raje-sh/site-exporter-pdf:latest
```

- `-v <path_to_config_file>:/app/config.yml`: Maps your local configuration file to the container.
- `-v <path_to_output_dir>:/app/out`: Maps your local output directory to the container, where PDFs will be saved.
<!-- - `--cap-add=SYS_ADMIN` capability is needed to enable Chrome sandbox that makes the browser more secure.  -->
- (optional) `--network="host"` is needed when the target site is also running on the same host as a Docker container.

### 3. View the Output 🎉

After the Docker command completes execution, navigate to the out directory on your host machine to view the generated PDF files.

## Configuration Options

| Property                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Default Value                                                        | Required |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------- |
| `site.baseUrl`                   | The base URL of the site to be converted into a PDF.                                                                                                                                                                                                                                                                                                                                                                                                                    | None                                                                 | Yes      |
| `site.links`                     | A list of specific paths to append to `baseUrl` for conversion.                                                                                                                                                                                                                                                                                                                                                                                                         | None                                                                 | Yes      |
| `site.cookies`                   | An optional list of key-value pairs representing cookies to be set in the browser before the page loads. Each cookie should include a `key` (the cookie name), `value` (the cookie value) and the optional `domain`. This can be useful for pages that require authentication or specific session data to render content correctly. <br/>**Note**: The cookie domain is automatically determined from the baseUrl if not provided.                                                                           | []                                                                   | No       |
| `site.headers`                   | An optional list of key-value pairs representing headers to be set in every http request made by the page. **Note**: header keys are converted to lowercase automatically.                                                                           | []                                                                   | No       |
| `browser.headless`               | This is typically set to true for production environments to ensure faster processing and minimal resource usage. Note: Setting this to false is useful primarily for debugging or development purposes, where you may need to see the browser's behavior visually.                                                                                                                                                                                                     | true                                                                 | No       |
| `browser.inject.css`             | Allows you to customize the content styling of a web page before converting it to a PDF by injecting custom CSS. This field accepts a list of CSS entries, where each entry can be a `file` path, a `content` string, or a `URL`. Note: If you provide a file path, ensure that the corresponding file is available inside the Docker container by using the appropriate volume mapping.[see sample](#js-and-css-injection)                                             | []                                                                   | No       |
| `browser.inject.js`              | Allows you to inject custom JavaScript into the web page before converting it to a PDF. This field accepts a list of JS entries, where each entry can be a `file` path, a `content` string, a `URL`, or an `eval` property for dynamically evaluated JavaScript. Note: As with CSS, if you provide a file path, ensure that the corresponding file is available inside the Docker container by using the appropriate volume mapping.[see sample](#js-and-css-injection) | []                                                                   | No       |
| `browser.inject.assetLoadWaitMs` | Wait time in milliseconds for assets to load before capturing the page.                                                                                                                                                                                                                                                                                                                                                                                                 | `100`                                                                | No       |
| `browser.viewport`               | Defines the browser’s viewport size, including width and height in pixels. This setting controls the dimensions of the rendering area before generating the PDF.                                                                                                                                                                                                                                                                                                        | 1260x968 (width x height)                                            | No       |
| `browser.pageTimeout`            | Timeout in milliseconds for page load and navigation.                                                                                                                                                                                                                                                                                                                                                                                                                   | `30000`                                                              | No       |
| `concurrency`                    | Number of concurrent pages to process.                                                                                                                                                                                                                                                                                                                                                                                                                                  | `3`                                                                  | No       |
| `output.dir`                     | Specifies the directory inside the Docker container where the generated PDFs will be saved. To view the files on your host machine, you need to map this directory to a directory on your host using Docker volume mapping.                                                                                                                                                                                                                                             | `./out`                                                              | No       |
| `output.type`                    | Type of output: `single` for one file, `separate` for multiple files.                                                                                                                                                                                                                                                                                                                                                                                                   | `single`                                                             | No       |
| `output.filename`                | The filename for the single output PDF, or base filename for multiple files.                                                                                                                                                                                                                                                                                                                                                                                            | `output`                                                             | No       |
| `output.filenameEval`            | JavaScript code to evaluate the filename dynamically. (if `type` is `separate`)                                                                                                                                                                                                                                                                                                                                                                                         | `document.title.replace(/[/\\?%*:\|"<>]/g, '_').trim()`              | No       |
| `output.pdfOptionsAsJSON`        | Allows you to configure PDF generation options using a JSON string. This field accepts all options defined in [Puppeteer’s PDFOptions](https://github.com/puppeteer/puppeteer/blob/e25a4a1a890b662680a9fcc4cb24eda09e8154c3/packages/puppeteer-core/src/common/PDFOptions.ts#L73), except for the `path` option. This includes settings for margins, headers, footers, and more.                                                                                        | `{"margin": {"top": 100, "right": 100, "bottom": 100, "left": 100}}` | No       |

### Environment Variables in config.yml

The `config.yml` file supports environment variable substitution. Variables defined in the configuration file are automatically replaced with their corresponding values from the environment. Ensure that the container has the necessary environment variables set for the application to function correctly.

You can specify default values for environment variables using the syntax ${ENV_VAR:-default-val}. For example:

```yaml
site:
  cookies:
    - key: "jwt"
      value: "${SECRET_AUTH_TOKEN:-default-token}"
```

In this example, the `SECRET_AUTH_TOKEN` environment variable is used to set the value of the authToken cookie. If `SECRET_AUTH_TOKEN` is not set, the default value `default-token` will be used.

#### Passing Environment Variables to the Container

To pass environment variables into a Docker container, you can either use an .env file or the -e flag when running the docker run command.

```bash
docker run -it --rm --cap-add=SYS_ADMIN \
  -e SECRET_AUTH_TOKEN=your-secret-token \
  --env-file .env \
  -v ./config.yml:/app/config.yml \
  -v ./out:/app/out \
  ghcr.io/raje-sh/site-pdf-exporter:latest

```

### JS and CSS Injection

#### Example configuration:

```yml
# Omitted for brevity
# ---
# (Top configuration details omitted)
# ...
browser:
  inject:
    css:
      - file: /app/inject/styles/custom.css
      - content: |
          body { background-color: lightgray; }
      - url: https://example.com/styles.css
    js:
      - file: /app/inject/scripts/custom.js
      - content: |
          document.body.style.backgroundColor = 'lightgray';
      - url: https://code.jquery.com/jquery-3.7.1.min.js
      - eval: |
          document.querySelector('h1').textContent = 'Injected via eval';

# Omitted for brevity
# ---
# (Bottom configuration details omitted)
# ...
```

#### Example Docker run command with volume mapping:

```bash
docker run -it --rm --cap-add=SYS_ADMIN \
  -v ./config.yml:/app/config.yml \
  -v ./out:/app/out \
  -v ./local-asset-path:/app/inject \
  ghcr.io/raje-sh/site-pdf-exporter:latest
```

In this example, the `./local-asset-path` directory on your host machine is mapped to `/app/inject` inside the container, allowing the application to access assets for styling and injecting javascript to the web page.

## Examples

Here are some example repositories demonstrating the use of this application to convert various types of sites to PDF:

<!-- TODO -->

- `Wiki.js PDF Exporter`: An example setup for converting Wiki.js pages to PDF documents.
- `YouTube Playlist Exporter`: Demonstrates how to convert YouTube playlist pages into PDFs.
- `Blog Exporter`: A setup for exporting blog pages to PDF format.
- `E-commerce Site Exporter`: Shows how to convert product and category pages from an e-commerce site to PDFs.

## Troubleshooting

If you encounter any issues:

- Ensure Docker is running and up to date.
- Verify that the correct directories and files are mapped as volumes in the Docker command.
- Check the `config.yml` file for any syntax errors.
  If the problem persists or you encounter a bug, please [open an issue](https://github.com/raje-sh/site-exporter-pdf/issues) on the GitHub repository. Your feedback helps improve the application!

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss any changes.

## License

This project is licensed under the `MIT License`. See the [LICENSE](./LICENSE) file for more details.