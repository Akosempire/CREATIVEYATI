/** @type {import('next').NextConfig} */
const nextConfig = {
  // services, about, contact and the work index were folded into the homepage
  async redirects() {
    return [
      { source: "/services", destination: "/#services", permanent: true },
      { source: "/about", destination: "/#about", permanent: true },
      { source: "/contact", destination: "/#contact", permanent: true },
      { source: "/work", destination: "/#work", permanent: true },
      { source: "/hero-preview", destination: "/", permanent: true },
    ];
  },
  async headers() { return [{ source: "/sw.js", headers: [{key:"Cache-Control",value:"no-cache, no-store, must-revalidate"},{key:"Service-Worker-Allowed",value:"/"}] }]; },
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  outputFileTracingIncludes: { "/api/**": ["./public/fonts/*.ttf"] },
  turbopack: { root: process.cwd() },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "xkjmurbqltmifbylywea.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "xdcumjsuwmvtiohrqqzu.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "drive.google.com", pathname: "/thumbnail" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
