import { JSONCookie as jsonCookie } from "cookie-parser";

function parseSetCookieHeader(setCookieHeader: any): Record<string, any> {
  return setCookieHeader.reduce((acc: Record<string, any>, cookie: string) => {
    const [ name, value ] = cookie.split(";")[0].trim().split("=");

    if (name && value) {
      acc[name] = jsonCookie(decodeURIComponent(value));
    }

    return acc;
  }, {});
}

export { parseSetCookieHeader };
