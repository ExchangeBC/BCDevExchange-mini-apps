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

## Promoting latest version to production

The application can be promoted across logical environments using ImageStreamTags.  Specifically - to promote (trigger deployment) of the latest version of the app into prod, you woudl do the following in the appropriate OpenShift project :

```
oc tag bcdevexchange-mini-apps:latest bcdevexchange-mini-apps:prod
```


