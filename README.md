# Mailery - Email Extractor

Mailery is a simple and efficient Electron application designed to extract email addresses from Excel files. It allows users to filter email addresses based on domains and download the extracted addresses in a `.txt` format.

## Features

- **Excel File Processing**: Select or drag Excel files (.xlsx, .xls) to extract email addresses.
- **Domain Filtering**: Filter email addresses based on specified domains.
- **Email Extraction**: Extracts email addresses from multiple sheets of Excel files.
- **Cross-Platform**: Built with Electron, it works on Windows, macOS, and Linux.

## Demo
[Mailery Drive Demo Link](https://drive.google.com/file/d/1kPmEJx9x1EWaq0imRb6hJwz9Ln9PtfQ4/view?usp=sharing)

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/umutxyp/mailery.git
    cd mailery
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Build and package the app:

    ```bash
    npm run package
    ```

4. To start the app in development mode:

    ```bash
    npm start
    ```

## Usage

- **Open the app**: When the app is opened, drag and drop Excel files or click to select files.
- **Set Domains**: Enter the email domains (separated by commas) to filter the extracted email addresses.
- **Download Results**: After the extraction is done, you can download the list of email addresses in a `.txt` format.

## File Processing Flow

1. Users can select multiple files or drag them into the application.
2. The files are processed, and email addresses are filtered based on the provided domains.
3. After the process completes, the extracted email addresses are displayed.
4. Users can download the email addresses as a `.txt` file.

## Technologies

- **Electron**: For creating a cross-platform desktop application.
- **TailwindCSS**: For modern and responsive design.
- **xlsx**: For reading and processing Excel files.

## Development

To start the development server:

```bash
npm start
```

To package the app:

```bash
npm run package
```

## License

MIT License. See the [LICENSE](LICENSE) file for more details.

---

**Producer**: [umutxyp](https://github.com/umutxyp) | Powered by [codeshare.me](https://codeshare.me)

