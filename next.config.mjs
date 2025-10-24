const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://files.cdn.printful.com https://cdn.snapcase.ai",
      "frame-src 'self' https://checkout.stripe.com https://*.printful.com",
      "connect-src 'self' https://api.stripe.com https://api.printful.com https://embed.printful.com",
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const resolveSecurityHeaders = () => {
  if (process.env.NEXT_PUBLIC_E2E_MODE === "true") {
    return securityHeaders.filter(
      (header) => header.key !== "Content-Security-Policy",
    );
  }
  return securityHeaders;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: resolveSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;

export { securityHeaders };
