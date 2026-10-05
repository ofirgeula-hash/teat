import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Proxy Firebase Auth's helper pages through this domain, so Google sign-in works in
  // iOS Safari and home-screen apps (which block the third-party storage the default flow needs).
  async rewrites() {
    return [
      { source: '/__/auth/:path*', destination: 'https://shopping-list-db6a8.firebaseapp.com/__/auth/:path*' },
      { source: '/__/firebase/:path*', destination: 'https://shopping-list-db6a8.firebaseapp.com/__/firebase/:path*' },
    ];
  },
};

export default nextConfig;
