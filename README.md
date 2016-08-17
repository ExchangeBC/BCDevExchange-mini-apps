# BCDevExchange-mini-apps
This repo contains multiple mini-apps represented either as APIs or as small UI-apps intended to be consumed through iFrames

For developing:

```
my-computer$ docker build -t mini-apps-dev -f Dockerfile.local .
my-computer$ have a coffee
my-computer$ ./dev.sh
container$ GITHUB_ACCESS_KEY=<your access key here> sails lift --models.migrate=create --verbose
```


If new npm modules are required you may have to re-run the build step in order to refresh the docker image



