const isProduction = process.env.NODE_ENV === "production";
const scriptSrcDirectives = [
  "script-src 'self'",
  "'unsafe-inline'",
  "https://js.stripe.com",
  "https://files.cdn.printful.com",
  "https://cdn.segment.com",
  // Allow Vercel Live preview tooling (injected on preview builds).
  "https://vercel.live",
];

if (!isProduction) {
  scriptSrcDirectives.push("'unsafe-eval'");
}

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
      // TODO(security): tighten script-src once nonce-based bootstrapping is wired to satisfy Next inline needs.
      scriptSrcDirectives.join(" "),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://files.cdn.printful.com https://cdn.snapcase.ai",
      "frame-src 'self' https://checkout.stripe.com https://*.printful.com https://vercel.live",
      "connect-src 'self' https://api.stripe.com https://api.printful.com https://embed.printful.com https://api.segment.io https://cdn.segment.com https://cdn-settings.segment.com https://vercel.live wss://vercel.live",
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

export { securityHeaders };
