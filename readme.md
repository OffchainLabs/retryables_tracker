# Retryables Tracker

### Set up
1. Install psql and create db
1. `yarn install`
1. Set env variables (see .env.sample)
1. Init / seed db:
    - See `db/initChains.ts`; add or remove chains as needed
    - `yarn init_db`

## Processes
1. **Sync**: continuously sync target chain ID to tip, saving failed/redeemable retryables in db: e.g. 
    - `yarn sync --chainid 42161`
    - run `yarn sync --help` to view all optional / default params

2. **Update**: check if redeemable retryables are stored in db, and check/update their status if so, e.g. 
    - `yarn update --chainid 42161`
    - run `yarn update --help` to view all optional / default params

3. **Report** Periodically report unredeemed retryables to slack for target chain ids, e.g.,
    - yarn report --chainids 42161 42170
        - run `yarn report --help` to view all optional / default params

4. **Server** Start server for `/unredeemed/mainnet` endpoint (PORT specified in ENV Var).
    - `yarn start_server`

### Exclude Target Retryable From Reporting
If a retryable ticket is, e.g., diagnosed as expected to fail and shouldn't be reported, you can flag it as such, and `report` will ignore it. 

- `yarn set_dont_report --help` for details


### run with docker
To run this docker, we should run a postgresql database docker first:
```
docker run --name postgresql -e POSTGRES_USER=SuperCoder -e POSTGRES_PASSWORD=mypassword -p 5432:5432 -v /data:/var/lib/postgresql/data -d postgres
```
Then we can build the docker image:
```
docker build -t retryables-v2
```
When finish building, we shoud run set our env file:
```
mv .env.sample env_docker
```
Then start init db:
```
docker run --name=init_db --network host --env-file=./env_docker -d retryables-v2 init_db
```
check db init:
```
docker logs init_db
```
once we see `Done in xx s`, then we can keep on starting others containers
```
docker run --name=retryable-v2-sync-{networkId} --network host --env-file=./env_docker -d sync --chainid 42161
```
and so others process.