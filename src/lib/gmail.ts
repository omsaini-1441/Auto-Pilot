export function gmailComposeUrl(opts: {
  to: string;
  subject: string;
}): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: opts.to,
    su: opts.subject,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function mailtoUrl(opts: { to: string; subject: string }): string {
  return `mailto:${encodeURIComponent(opts.to)}?subject=${encodeURIComponent(opts.subject)}`;
}
