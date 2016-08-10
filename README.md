# BCDevExchange-mini-apps
This repo contains multiple mini-apps represented either as APIs or as small UI-apps intended to be consumed through iFrames

For developing:

Setup:

```
my-computer$ docker build -t miniapps .
my-computer$ have a coffee
my-computer$ ./dev.sh
container$ GITHUB_ACCESS_KEY=27c38d279192e56b3138b03c0b3ffe4e81f3e5a0 sails lift --models.migrate=create --verbose
```

```
my-computer$ docker build -t miniapps .
my-computer$ have a coffee
my-computer$ npm install
my-computer$ docker run --rm -v `pwd`:/app -w /app -p 1337:1337 -ti miniapps bash
image$ bower install --allow-root
image$ sails lift --models.migrate=create --verbose
```


Therever after:

```
my-computer$ docker run --rm -v `pwd`:/app -w /app -p 1337:1337 -ti miniapps sails lift --models.migrate=create --verbose
```

or if you want to re-run at the command line:

```
my-computer$ docker run --rm -v `pwd`:/app -w /app -p 1337:1337 -ti miniapps bash
image$ sails lift --models.migrate=create --verbose
```

If new npm modules are required you will have to re-run npm install *in the container* or whatever is appropriate.



