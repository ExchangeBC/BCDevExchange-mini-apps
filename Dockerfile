FROM node:4.4.3-wheezy

# Sails setup
WORKDIR /app/
RUN npm -g install sails && npm install sails-disk --save
ADD package.json /app/
ADD Gruntfile.js /app/
RUN npm install
ADD . .

RUN adduser --system devex && chown -R devex:0 . && chmod -R 770 .

USER devex

VOLUME /app

EXPOSE 1337

CMD ["sails","lift","--models.migrate=create", "--verbose"]
