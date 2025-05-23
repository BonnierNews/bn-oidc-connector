import config from "exp-config";

const knownToggles = [
  "exampleFeature1", // Since 2014-05-02
  "exampleFeature2", // Since 2014-05-22
];

knownToggles.sort();

config.toggle = config.toggle || {};

export function toggle(name: string) {
  if (knownToggles.indexOf(name) === -1) {
    throw new Error(`Unknown toggle '${name}'`);
  }
  if (process.env.NODE_ENV === "test") {
    return true;
  }
  const value = config.toggle[name];
  return value === true || value === "true";
}

toggle.knownToggles = knownToggles;
