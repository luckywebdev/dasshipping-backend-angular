## Installation

```bash
$ yarn
```

## Local development
Is done using docker-compose. The compose file creates 2 services:
- app - build app from your local code and start it in watch mode
- db - a default PSQL local instance (server) with the default credentials

For both of them machine has access:
- app - http://127.0.0.1:3000
- db - http://127.0.0.1:5432

### Pre-requirements
1. Docker CE installed (Docker Engine release 18.02.0+)
2. Set following env variables:
```bash
export DB_VOLUME=/data/psql-yota      # to persist database content
```

### Run project
```bash
docker-compose up -d
```
Note: Make sure that the path provided in `$DB_VOLUME` is shared with docker

### Useful commands
Connect to container command line:
```bash
docker exec -it <container_name|container_id> /bin/bash # connect to container
```

Rebuild the local image of the app:
```bash
docker-compose up -d --build app
```

Stop running containers (provided by local `docker-compose.yml`):
```bash
docker-compose down
```

Run services in attached mode:
```bash
docker-compose up
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## How migrations work
Once you get into production you'll need to synchronize model changes into the database.
Typically it is unsafe to use `synchronize: true` for schema synchronization on production once
you get data in your database. Here is where migrations come to help.

A migration is just a single file with sql queries to update a database schema
and apply new changes to an existing database.

Change environment variable `MIGRATIONS_RUN=true` and on server starts migrations will execute

## Creating a new migration
To generate a new migration use command `yarn migration:create -n MigrationFileName`
Usually migration files are named like `timestamp.ts` and they are saved in `scr/migrations`

## Running and reverting migrations

Once you have a migration to run on production, you can run them using a CLI command:

```
yarn migration:run
```

**`typeorm migration:create` and `typeorm migration:generate` will create `.ts` files. The `migration:run` and `migration:revert` commands only work on `.js` files. Thus the typescript files need to be compiled before running the commands.** Alternatively you can use `ts-node` in conjunction with `typeorm` to run `.ts` migration files. 

If for some reason you want to revert the changes, you can run:

```
typeorm migration:revert
```

This command will execute `down` in the latest executed migration. 
If you need to revert multiple migrations you must call this command multiple times.

For more information about migrations, see https://github.com/typeorm/typeorm/blob/master/docs/migrations.md

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## Branching Strategy

```
[task-number] [commit description]
```

Ex. YS-10 backend setup

## Deployments

### Staging

Setup:
- create a server and add public ssh key to the server and private to te giltab CI/CD
variables under SSH_PRIVATE_KEY
- install docker and docker-compose on target server
- In `gitlab-ci` change the variable `IP_STAGING` to desired one
- push your changes to branch `staging`

All the deployments are managed by gitlab CI. To deploy you just have to push your changes on branch `staging` 
and the tasks `build` then `deploy` will be triggered. 
Watch the pipelines status in gitlab ci/cd - pipelines

The result image tag will looks like `registry.gitlab.com/{group}/{project}:staging`

### Production

This repository oly build the image for production and add it into gitlab registry, the deploy is done using repository 
production cluster. For more information consult the about deploy consul readme file form production cluster repository

In order to build the image you have to push your code on branch production. The job build will 
generate an image with tag in following format:

`registry.gitlab.com/{group}/{project}:{commit_hash}`
