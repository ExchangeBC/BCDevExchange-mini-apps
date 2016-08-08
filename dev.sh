#!/usr/bin/env bash

docker run --rm -it -p 1337:1337 \
-v ${PWD}/api:/app/api \
-v ${PWD}/assets:/app/assets \
-v ${PWD}/config:/app/config \
-v ${PWD}/tasks:/app/tasks \
-v ${PWD}/views:/app/views \
--name mini-apps-dev mini-apps-dev bash
