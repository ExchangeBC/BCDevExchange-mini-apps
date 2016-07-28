# BCDevExchange-mini-apps
This repo contains multiple mini-apps represented either as APIs or as small UI-apps intended to be consumed through iFrames

For developing:

Setup:

```
my-computer$ docker build -t miniapps .
my-computer$ have a coffee
my-computer$ docker run --rm -v `pwd`:/app -w /app -p 1337:1337 -ti miniapps bash
image$ npm install
image$ bower install --allow-root
image$ sails lift --models.migrate=create --verbose
```

Note:
On OSX there are still issues with running npm from the image into a mounted file system.  The errors are known bugs being addressed by Docker, but are still present as of version 1.12.0-rc4-beta20.
If this affects you then you may need to run npm install and perhaps even bower install from your machine:
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

If new npm modules are required you will have to re-run npm install or bower or whatever is appropriate.



