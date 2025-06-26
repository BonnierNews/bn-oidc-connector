import { JSONCookie as jsonCookie } from "cookie-parser";

function parseSetCookieHeader(setCookieHeader: any): Record<string, any> {
  return setCookieHeader.reduce((acc: Record<string, any>, cookie: string) => {
    const [ name, value ] = cookie.split(";")[0].trim().split("=");
    if (name) {
      acc[name] = value ? jsonCookie(decodeURIComponent(value)) : null;
    }

    return acc;
  }, {});
}

export { parseSetCookieHeader };
