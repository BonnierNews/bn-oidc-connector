# Node Starter App for TypeScript

## Description

Fork this project when creating new Typescript Node.js backend projects. The goal of the project structure is:

- Any developer should be able to quickly understand the project, develop it and deploy it

Checking out the code and running `npm install && npm test` should take you most of the way.

## The correct way to start a new repo

Create a repo on github (or ask someone with permissions to create it for you)


```bash
git clone git@github.com:BonnierNews/<your-new-repo>.git
cd <your-new-repo>

git remote add starterapp git@github.com:BonnierNews/node-starterapp-ts.git
git fetch starterapp
git merge --allow-unrelated-histories starterapp/main
```

Now you have a project to start developing in!

## To get changes/files

To get changes or files from this repo do

```bash
git remote add starterapp git@github.com:BonnierNews/node-starterapp-ts.git
git fetch starterapp

# apply a commit
git cherry-pick <some-commit>

# get a file from the starterapp
git checkout starterapp -- <path-to-file>
```

## Docker setup

At some point after starting the repo, but before it is built, the repo should
be setup to use docker.

```bash
# Commit the generated files: docker-compose.yml, Dockerfile, .dockerignore
git add docker-compose.yml Dockerfile .dockerignore
git commit
```

## Local setup

```bash
npm install # install dependencies
npm test # run tests
npm run dev # start dev server
```

## Utilities

Other Bonnier News projects that you are advised to use:

* https://www.npmjs.com/package/exp-amqp-connection - for working with rabbitmq
* https://www.npmjs.com/package/exp-fetch - for caching requests to external resources.
* https://www.npmjs.com/package/exp-cachebuster - cache busting.

## Branch strategy

Prefer development straight on the main branch. Make small isolated commits.
Never commit anything that breaks tests, they should work every commit so that
`git bisect` can be used if necessary.

For larger changes, or when you want feedback before committing to main, use
feature branches with [git flow][11]
inspired names such as `feature/add-cachebuster` or `spike/switch-to-iojs` and
make a pull request from [github][12].

## Testing strategy

Tests go in the `test` directory. All tests must be deterministic and fast.
Use [mocha][1] for unit style tests and follow the
naming/structure from the project. Unit tests for module `lib/foo.js` go in
`test/lib/foo-test.js`. Use [mocha-cakes-2][2]
for end to end tests and put them in `test/features`. Use [nock][5]
and [supertest][6] in the feature tests.

## Deploy

To be written.

## Common project structure

```bash
## Directories
lib/ - this is where the code is
config/ - configuration
docs/ - documentation in .md files
logs/ - logs for tests
node_modules/ - dependencies
public/ - client side resources
scripts/ - various executable bash/js-scripts for deploying, manual testing etc.
test/ - test code
tmp/ - everything in here is ignored, put your own one off experiments here

## Files
README.md - see below
package.json - define dependencies etc.
app.js - start the service in a single process
```

### Readme

A `README.md` must be included and include:

- _Description_: Describe the service, what does it do?
- _Local setup_: How to get the application up and running locally (software to install, hosts-file/`$PATH` changes etc) and possibly information on how to develop/debug the application effectively
- _Branch strategy_: How to work with branches, pull requests, code review etc. in this project
- _Testing strategy_: What is tested and how? What kinds of tests exists. When introducing new functionality what new tests should be written?
- _Deploy_: How to deploy the application in the environments where it runs

## npm and package.json

npm is used as the task runner of choice for basic tasks. These are the standard tasks that all projects should have:

```bash
npm install # Installs dependencies and builds minified CSS/JS, etc.
npm test # Runs all tests
npm start # Runs the service locally
```

Minimize the need to run commands manually by bundling them in the scripts section of package.json:

Notes:

- prepublish runs on `npm install` and must return successful exit code even when only production dependencies are installed.

- The project's main file should be set in package.json's field "main". This will make the application easy to start with `npm run build && node .`.

- [eslint][3] should be used to verify that the code is well structured and looks nice. To make sure the code stays nice these tools are run on `npm test` (see scripts above).

- All tools used (above: [mocha][1], [eslint][3]) should be configured in such a way that they can be run manually when needed. Prefer checked in configuration files (for example `mocha.opts`) over specifying many command line arguments. When debugging a specific test case you should be able to run just [mocha][1] without any special arguments.

Avoid:

- relying on globally installed `npm` modules ([mocha][1], [eslint][3] etc.), include them in `package.json` as dependencies or dev dependencies instead. Put `node_modules/.bin` in your `PATH` to run the binaries manually or use [npx](https://www.npmjs.com/package/npx)!

## Configuration

Configuration is handled with [exp-config][8] via a mix of configuration files and environment variables. It reads configuration for the correct environment (controlled by the `NODE_ENV` environment variable).

Apart from reading the correct json file it will also read, if available, a file called `.env` in the project's root directory. In this file you can override entries in the config files. Here is an example .env file:

```shell
# Prod
apiUrl=http://ursula1.expressen.se
pufferBaseUrl=http://z.cdn-expressen.se/images

# Stage
#apiUrl=http://ursula.api.expressen.se
#pufferBaseUrl=http://exp-www-test7.bonnierdigitalservices.se/images

requestLogging=false
toggle.ads=false
```

As you can see this file looks like a shell file setting environment variables. It can contain comments.

Environment variables have the highest priority: `requestLogging=true node .`

This setup makes it easy to run a service locally using production config and just override a selected few properties. This is very useful when doing performance testing etc. It keeps the need to introduce more and more environments in check.

## Shared code

If you have a piece of code that you feel would be useful to other teams, release it as a public npm module. Most of our common code is fairly generic (logging, configuration, cacheBusting) and can be turned into real open source modules.

## Testing

Tests are run using `npm test` which in turn runs tools that test the code and verify that it follows certain code conventions.

Test tools that we use:

- [mocha][1] - for running tests and formatting results
- [mocha-cakes-2][2] - BDD-plugin for mocha, use for full stack tests
- [eslint][3] - javascript static code & style analysis
- [nock][5] - http mocking
- [supertest][6] - http test framework
- [chai][7] - assertion library

Tests should be deterministic, fast and full stack. Static code analysis and code style is part of the tests.

To make the application possible to test with [supertest][6] you need to export the application from the main file:

```javascript
// In app.js
var express = require("express");
var app = express();

app.get(...) // Setup routes

modules.exports = app; // Expose app to tests

// Only listen if started, not if included
if (require.main === module) {
  app.listen(...)
}
```

Now the tests can include [supertest][6] to make requests to the application on a random port which avoids a port conflict if the application is already running:

```javascript
var request = require("supertest");
var app = require("../");

describe("/", function () {
  it("gives 200 OK", function (done) {
    request(app).get("/").expect(200, done);
  });
});
```


## Code style

When writing node code you don't need to work around browser quirks and you can use modern JavaScript features such as array.map, array.forEach etc.

We rely on [eslint][3] to detect certain errors such as unused variables, duplicate declarations etc. This means that you should not adapt your coding style because of hoisting. Declare variables when they are needed, not at the top of the scope. 

Eslint will also prevent you from using the following Typescript features:
- Namespaces
- Abstract classes
- Class inheritance
- Enums
- Decorators
- Private property

To avoid calling a callback twice, always return the result of the callback. Since calling the callback with an error is done so much this should be done as a one-liner:

```javascript
function doStuff(id, callback) {
  database.find(id, function (err, data) {
    if (err) return callback(err);

    // do your thing...

    return callback(null, data);
  });
}
```

We use [eslint](https://eslint.org/) configured using [eslint-config-exp](https://www.npmjs.com/package/eslint-config-exp) as code formatter. Ensure that your editor runs eslint --fix on save.

## Operations

To be written.

[1]: http://visionmedia.github.io/mocha/
[2]: https://github.com/iensu/mocha-cakes-2
[3]: http://eslint.org/
[5]: https://github.com/pgte/nock
[6]: http://visionmedia.github.io/superagent/
[7]: http://chaijs.com/
[8]: https://github.com/BonnierNews/exp-config
[10]: https://github.com/BonnierNews/exp-asynccache
[11]: http://jeffkreeftmeijer.com/2010/why-arent-you-using-git-flow/
[12]: https://github.com/
