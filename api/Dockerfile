FROM public.ecr.aws/lambda/nodejs:14

RUN mkdir config && mkdir country-codes && mkdir functions && mkdir functions/address

COPY config/ ./config
COPY common/ ./common
COPY functions/address/ ./functions/address

COPY package.json package-lock.json ./

RUN npm install --only=prod
