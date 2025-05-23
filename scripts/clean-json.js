/* eslint-disable no-console */
import fs from "fs";

const input = process.argv[2];

function deleteRecursive(data, key) {
  const keys = Array.isArray(key) ? key : [ key ];
  for (const property in data) {
    if (Object.prototype.hasOwnProperty.call(data, property)) {
      if (keys.indexOf(property) > -1) {
        delete data[property];
      } else if (typeof data[property] === "object") {
        deleteRecursive(data[property], keys);
      }
    }
  }
}

function sortObject(obj) {
  if (typeof obj !== "object") return obj;
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    const tmp = [];
    obj.forEach((item) => {
      tmp.push(sortObject(item));
    });
    return tmp;
  }

  const temp = {};
  const keys = [];

  Object.keys(obj).forEach((key) => {
    keys.push(key);
  });

  keys.sort();
  for (let index = 0; index < keys.length; index++) {
    temp[keys[index]] = sortObject(obj[keys[index]]);
  }
  return temp;
}

const inputAsJson = JSON.parse(String(fs.readFileSync(input)));
const sorted = sortObject(inputAsJson);
deleteRecursive(sorted, [ "from", "resolved" ]);

console.log(JSON.stringify(sorted, null, 2)); // eslint-disable-line no-console
