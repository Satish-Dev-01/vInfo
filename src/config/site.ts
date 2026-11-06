export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  badge?: string;
}

export const siteConfig = {
  name: 'Vinfo Platform',
  description: 'Enterprise-grade, scalable Next.js application architecture built for high performance and flexibility.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og.jpg',
  links: {
    github: 'https://github.com',
    docs: '/docs',
  },
  mainNav: [
    {
      title: 'Overview',
      href: '/',
    },
    {
      title: 'Sign Up',
      href: '/signup',
      badge: 'New',
    },
    {
      title: 'Architecture',
      href: '/#architecture',
    },
    {
      title: 'Services',
      href: '#services',
    },
    {
      title: 'Log In',
      href: '/login',
      badge: "New"
    },

  ] satisfies NavItem[],
};
