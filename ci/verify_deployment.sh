#!/bin/sh
# Invoked with one argument: either "staging" or "prod"
TXT_CYAN='\e[1;36m ' && TXT_CLEAR='\e[1;0m ' && TXT_RED='\e[1;31m ' && TXT_GREEN='\e[1;32m '

TEST_TOKEN=52a07-524ed-8a4d4-067b0
DEPLOY_ENV=$1
SERVICE=$2
STAGING_URL="https://staging.cleanse.fetchify.com/${SERVICE}?getEnv=true"
PROD_URL="https://api.cleanse.fetchify.com/${SERVICE}?token=${TEST_TOKEN}"

if [ $DEPLOY_ENV = "staging" ]
then
    URL=$STAGING_URL
    GREP='staging'
elif [ $DEPLOY_ENV = "prod" ]
then
    URL=$PROD_URL
    GREP='Maidenhead'
else 
    echo -e "${TXT_RED} deploy_env $DEPLOY_ENV: argument was not recognised" && exit 1
fi

echo -e "${TXT_CYAN} Sending test GET request to $URL..."
sleep 2s

echo -e "${TXT_CYAN} Checking deployed ${DEPLOY_ENV} $SERVICE API response"
if [ "$(curl -v --request GET --url $URL --header 'Content-Type: application/json' --data '{"query": "fetchify","country": "gb"}' | grep $GREP)" ] ; then
    echo -e "${TXT_GREEN} Status 200 OK, API is live" 
    exit 0
else
    echo -e "${TXT_RED} Failed to get a 200 response" && exit 1;
fi