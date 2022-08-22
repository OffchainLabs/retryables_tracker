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