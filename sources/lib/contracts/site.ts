export type SiteSettings = {
  name: string;
  tagline: string;
  description: string;
  hotline: string;
  hotlineHref: string;
  zaloHref: string;
  email: string;
  emailHref: string;
  address: string;
  supportHours: string;
  booking: {
    holdHours: number;
    cancelCutoffDays: number;
    maxGuestsPerOrder: number;
  };
};

export type NavigationItem = {
  label: string;
  href: string;
};
