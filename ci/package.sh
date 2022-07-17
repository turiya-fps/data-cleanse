#!/bin/bash

# Must be executed with 2 args:
# 1. Deploy stage (options: staging, prod)
# 2. Deploy region (options: us-west-2, eu-west-2)

if [[ $2 == us-west-2 ]]
then
    SHORT_REGION="usw2"
elif [[ $2 == eu-west-2 ]]
then
    SHORT_REGION="euw2"
fi

aws cloudformation package \
    --template-file .aws-sam/build/template.yaml \
    --s3-bucket data-cleanse-api-$SHORT_REGION \
    --s3-prefix $1 \
    --output-template-file packaged.yml \
