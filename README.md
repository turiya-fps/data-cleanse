# Data Cleansing API

## Project Overview
This serverless application essentially wraps the `best_match_only` functionality offered by the Fetchify Validation API. It currently exposes an address-cleansing endpoint.

## Develop & Test

### Pre-requisites:

* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)
* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* Node.js - [Install Node.js 14](https://nodejs.org/en/), including the NPM package management tool.

### Local development:

1. Clone the repository to your local machine. If using Windows, choose a WSL directory.
2. In a WSL terminal, use the SAM cli to generate a docker image of your application and a SAM-specific template file: 
    ```
    $ cd api
    $ npm install
    $ sam build
    ```
    > N.b. If you want to automatically rebuild the application whenever you save changes, use `npm run rebuild`

3. Use the `$ sam local invoke` command to run a function as a local image replicating the asynchronous environment of a deployed Lambda, and pass in event objects for testing, e.g.
    ```
    $ sam build
    $ sam local invoke -e events/address-event-partial_match.json AddressCleanseFunction
    ```
4. The script `$ npm run local-invoke` invokes all the functions in sequence, mainly intended to be run as part of the precommit hook. This measure is in place because unit testing alone will fail to detect many issues that will cause a Lambda runtime error. Please add to the script invoke commands for any new functions intended for deployment.

### Git
- It is better to run `git add` and `git commit` commands from the project root, to prevent confusion between the git module and submodule.
- A pre-commit hook is configured to run the following `package.json` scripts in order:
    - `lint`
    - `test`
    
    A commit will fail if any of the above scripts fail.

### Unit testing

- The full test-suite is configured to run on a pre-commit hook.
- The test-suite can also be run using
    ```
    $ npm run test
    ```
- Remember to add unit tests for any new logic you introduce to the application code.

## CI/CD

There are currently three pipelines that can run, each dependent on specific Git events / conditions being met:

|   | Behaviour                       | Conditions               | Notes                                                       |
|---|---------------------------------|--------------------------|-------------------------------------------------------------|
| 1 | Builds image and runs unit tests                       | Feature MRs to `develop` | This pipeline runs on the **projected merge-result**. Any MR to `develop` |
| 2 | Builds image and runs unit tests. Deploys updates to staging system by executing a cloudformation changeset | Release MRs to `master`  | Any MR raised to `master` from a branch-name matching the pattern `release/x.x.x`  |
| 3 | Deploys updates to production system by executing a cloudformation changeset. Tags the merge commit with the version number and adds an auto-generated changelog as a release note. Creates an MR from `master` to `develop`. Posts release information to the Microsoft Teams *Releases* channel | Successful merges to `master`  | Any merge into `master` from a branch-name matching the pattern `release/x.x.x`  |

This automation configuration aligns with the *Gitflow* strategy of creating "release branches" from `develop` which will be merged into `master` when they are ready for release, as shown in this diagram https://wac-cdn.atlassian.com/dam/jcr:a9cea7b7-23c3-41a7-a4e0-affa053d9ea7/04%20(1).svg?cdnVersion=1597


# Deployment

## Automated Deployments

All releases, staging and prod, are now automated in continuous deployment, described above. To trigger a deployment, the following steps should be followed closely:
### Staging
  1. When ready to release, create a branch from `develop` named `release/x.x.x` - containing the incremented version - this *must* be a three-level version number and adhere to the [versioning strategy](#versioning).
  1. On the `release/` branch, update the version number in `api/package.json` and the `VersionDescription` against each LambdaFunction in the template, as well as any other minor changes needed. Commit these changes.
  1. Ensure the `release/` branch can be merged cleanly into `master`, with no conflicts.
  1. Create an MR from the `release/` branch into `master`.
  
      > ***Tip:*** You can push and open an MR with a single command:
      > ```
      > git push -o merge_request.create -o merge_request.target=master
      > ```
  1. The staging deployment pipeline will be initiated when you open the MR - it can take around ten minutes to complete. It will only deploy to ONE region, us-west-2. The staging ALB is weighted 100% to this region.
  1. While the pipeline is running, launch a staging `elastic-srv` cluster to us-west-2, by following the README of that project [here](https://gitlab.com/craftyclicks/global-api/elastic-srv/-/blob/master/README.md). The staging cluster will provide our staging Lambda with backend functionality for testing.
      > ***Important:*** The `elastic-srv` staging cluster must be deleted after testing is complete (by deleting the Cloudformation stack), or significant costs will be incurred.
  1. Check that the [pipeline](https://gitlab.com/craftyclicks/api-services/data-cleanse/-/pipelines) succeeds. If not, you may have to do a manual deployment, see below.
  1. Manually test the staging system  using `curl` or an http client for the expected changes before continuing to the production pipeline.
### Production
  1. Once you have tested the staging API for the expected changes, and for any side effects, merge the MR from `release/` to `master`. 
  2. The prod deployment pipeline will be initiated at this point. It will take around fifteen minutes to complete.
  3. Check that all the jobs in the [pipeline](https://gitlab.com/craftyclicks/api-services/data-cleanse/-/pipelines) succeed. If not, you may have to do a manual prod deployment, see below, or manually complete the outstanding jobs in the pipeline.
  4. Test the production system using `curl` or an http client for the expected changes, and for any side effects.
  5. The auto-generated Release Note which has been added to the version tag is based on the names of all `feature` branches that have been merged into `develop` since the last release. This changelog generation will only work providing GitFlow has been followed strictly, and no special characters (except of course '-') have been used in branch names.
  6. Finally, check the back-merge MR (`master` --> `develop`) that was created by the release pipeline, and manually merge it.
  7. In the scenario of a broken production release that you need to revert quickly, you can use the AWS Lambda console to point the "live" alias to a previous version. Alternatively, you can use a manual deployment (see next section) to push the fixed code to production.

## Manual Deployments
Deployment is done manually using the SAM CLI. Each region / stage is deployed individually. Our target infrastructure is to deploy the application to two regions which will allow for improved latency as well as regional failover. Currently configured environments are `staging-US` and `prod-US`.

| System | Region | `config-env` |
|--|--|--|
| STAGING | us-west-2 | `staging-US` |
| STAGING | eu-west-2 | `staging-EU` |
| PROD | us-west-2 | `prod-US` |
| PROD | eu-west-2 | `prod-EU` |

```
$ sam deploy --config-env <config-env>
```

>  N.b. If working in WSL/Linux you may have to synchronise your system's clock with AWS by running 
> ```
> $ sudo ntpdate pool.ntp.org
> ```

You can test deployments using curl:

### Staging
```
$ curl --request GET \
  --url 'https://staging.cleanse.fetchify.com/address?token=52a07-524ed-8a4d4-067b0' \
  --header 'Content-Type: application/json' \
  --data '{
	"query": "buckingham palace",
	"country": "gb"
}'
```
### Prod
```
$ curl --request GET \
  --url 'https://api.cleanse.fetchify.com/address?token=52a07-524ed-8a4d4-067b0' \
  --header 'Content-Type: application/json' \
  --data '{
	"query": "buckingham palace",
	"country": "gb"
}'
```

### Testing bulk requests live

To test the performance of either system under a typical client request-load cd into `api/` and run the `npm run live-test`, passing optional arguments following a `--`. The script runs a test harness that sends a number of asynchronous requests (which should elicit a *partial_match* response) to the API. Responses will be bulk-written to a time-stamped file in the `api/test/live-test/output/` directory.

| Arg | Type | Description | Optional values | Default |
|--|--|--|--|--|
| 1 | Integer | *n* requests | > 0 | 50 |
| 2 | String | System | `staging` or `prod` | `staging` |
| 3 | Boolean | getEnv | `true` or omit |

e.g. Running this command will send 1000 address cleanse requests to the prod system
```sh
$ npm run live-test -- 1000 prod
```

Running this command will send 1000 requests to the staging system calling the `getEnv` response
```sh
$ npm run live-test -- 1000 staging true
```
