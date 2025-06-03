function parseSetCookieHeader(setCookieHeader: any): Record<string, any> {
  const cookies: Record<string, any> = {};
  setCookieHeader.forEach((cookie: string) => {
    const [ name, value ] = cookie.split("; ")[0].split("=");
    if (name && value) {
      cookies[name] = JSON.parse(decodeURIComponent(value).replace(/^j:/, ""));
    }
  });
  return cookies;
}

export { parseSetCookieHeader };
