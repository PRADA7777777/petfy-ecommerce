import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  allowedDevOrigins: ['10.2.164.219', 'localhost', '192.168.1.0', '192.168.137.1'],
};

export default nextConfig;
