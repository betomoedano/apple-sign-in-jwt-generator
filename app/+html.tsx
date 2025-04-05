import { ScrollViewStyleReset } from "expo-router/html";

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Apple Client Secret Generator</title>
        <meta
          name="description"
          content="Securely generate JWTs for Apple Sign-In using your credentials. Works entirely in your browser — no data is sent to servers or stored anywhere."
        />
        <meta
          name="keywords"
          content="Apple, JWT, Client Secret, Apple Sign-In, Generator, Secure, Developer"
        />

        {/* Open Graph meta tags for social sharing */}
        <meta property="og:title" content="Apple Client Secret Generator" />
        <meta
          property="og:description"
          content="Securely generate JWTs for Apple Sign-In using your credentials. Works entirely in your browser — no data is sent to servers or stored anywhere."
        />
        <meta
          property="og:image"
          content="https://res.cloudinary.com/donplt0kp/image/upload/v1743890486/OG%20for%20Code%20with%20Beto/v7mv1tjgefhcat6ixkk5.png"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com" />

        {/* Twitter meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Apple Client Secret Generator" />
        <meta
          name="twitter:description"
          content="Securely generate JWTs for Apple Sign-In using your credentials. Works entirely in your browser — no data is sent to servers or stored anywhere."
        />
        <meta
          name="twitter:image"
          content="https://res.cloudinary.com/donplt0kp/image/upload/v1743890486/OG%20for%20Code%20with%20Beto/v7mv1tjgefhcat6ixkk5.png"
        />

        {/* Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
            However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line. */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles to ensure dark background color */}
        <style dangerouslySetInnerHTML={{ __html: darkBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const darkBackground = `
body {
  background-color: #121212;
  color: #ffffff;
}`;
