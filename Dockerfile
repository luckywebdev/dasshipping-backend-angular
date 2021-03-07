FROM node:12.14.1

COPY env /app/env
COPY src /app/src
COPY templates /app/templates
RUN mkdir -p /app/upload
COPY test /app/test
COPY *.json *.lock *.js /app/
WORKDIR /app

RUN yarn install --production=false
RUN yarn build

COPY src/public dist/public

COPY src/views dist/views

COPY src/pdf dist/pdf

EXPOSE 3000
