# LinkedIn Buddy Browser Extension

Save 30+ min daily automating LinkedIn profile visiting and connection requesting, helping you grow your professional network efficiently and safely.

## Features

- **Profile Visiting**: Automatically visits LinkedIn profiles from search results
- **Connection Requests**: Sends connection requests to visited profiles
- **Smart Automation**: Includes safety features like:
  - Random delays between actions
  - Profile visit history tracking
  - Visit limits to prevent detection
  - Automatic navigation back to search results
- **User-Friendly Interface**: Simple task setup and monitoring
- **Progress Tracking**: Monitors visit counts and connection requests

## Installation

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/linkedin-buddy.git
   cd linkedin-buddy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development build:
   ```bash
   npm start
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

### Production Build

1. Create a production build:
   ```bash
   npm run build
   ```

2. The production-ready extension will be in the `dist` folder

## Usage

1. Navigate to LinkedIn and perform a search for profiles you want to visit
2. Click the LinkedIn Buddy extension icon
3. Set up your visiting task with desired parameters
4. Start the automation process
5. Monitor the progress through the extension interface

## Safety Guidelines

- LinkedIn Buddy includes built-in delays and limits to prevent detection
- The extension maintains a history of visited profiles to avoid duplicates
- It's recommended to:
  - Use reasonable delays between actions
  - Don't exceed LinkedIn's daily limits
  - Monitor your account activity
  - Use the extension responsibly

## Technical Details

- Built with React and TypeScript
- Uses Chrome Extension APIs
- Implements webpack for bundling
- Includes TypeScript type definitions for better development experience

## Development

The project uses:
- React 18
- TypeScript
- Webpack for bundling
- Chrome Extension APIs

### Project Structure

```
linkedin-buddy/
├── src/                    # Source code
│   ├── background/         # Background scripts
│   ├── components/         # React components
│   └── utils/             # Utility functions
├── dist/                   # Built extension
├── webpack.config.js       # Webpack configuration
└── package.json           # Project dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational purposes only. Please use it responsibly and in accordance with LinkedIn's terms of service. The developers are not responsible for any misuse or account restrictions that may occur from using this extension.
