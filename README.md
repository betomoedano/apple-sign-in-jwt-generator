# Apple Client Secret Generator

A secure, client-side tool for generating Apple Sign In JWT tokens (client secrets). This tool runs entirely in your browser - no data is sent to any server or stored anywhere.

**Live Demo**: [https://applekeygen.expo.app/](https://applekeygen.expo.app/)

## What is this?

When implementing Sign in with Apple, you need to generate a client secret in JWT format to authenticate your backend server with Apple's services. This tool makes it easy to generate those JWT tokens using your Apple Developer credentials.

## How to Use

1. **Gather your Apple Developer credentials**:

   - **Key ID**: The 10-character identifier for your private key (found in your Apple Developer account under "Keys")
   - **Team ID**: Your Apple Developer team identifier (found in Membership details)
   - **Client ID**: Your Services ID identifier (e.g., `com.example.myapp.web`)
   - **Private Key**: The contents of your `.p8` file downloaded from Apple Developer portal

2. **Enter your credentials** in the corresponding fields

3. **Choose an expiration time** (Apple recommends using 6 months, which is the maximum allowed)

4. **Click "Generate JWT"**

5. **Copy your client secret** and use it in your Apple Sign In implementation

## Development

This app is built with:

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [jose](https://github.com/panva/jose) for JWT operations

## Security Notes

- Your private key and other credentials are processed entirely in your browser.
- No data is sent to any server or stored in any database.
- For maximum security, you can download this tool and run it locally without an internet connection.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## Author

Made with ❤️ by [Code with Beto](https://codewithbeto.dev)

## License

MIT
