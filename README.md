# Introduction

This project implements the `Trail` microservice that participates in the saga pattern with Amazon Elastic Kubernetes Service (EKS).

- [Introduction](#introduction)
  - [Usage](#usage)
    - [Build](#build)
    - [Deploy](#deploy)
  - [Clean up](#clean-up)
  - [Inputs and outputs](#inputs-and-outputs)

## Usage

### Build

1. Clone the repo.

```bash
git clone ${GIT_URL}/eks-saga-trail
```

> Skip this step, if instructions to build images were followed in the `eks-saga-aws` repository. Else, follow the steps below to build and push the image to Amazon ECR.

2. Build the Docker image and push to Docker repository.

```bash
cd eks-saga-trail/src

aws ecr get-login-password --region ${REGION_ID} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION_ID}.amazonaws.com
IMAGE_URI=${ACCOUNT_ID}.dkr.ecr.${REGION_ID}.amazonaws.com/eks-saga/trail'
docker build -t ${IMAGE_URI}:0.0.0 . && docker push ${IMAGE_URI}:0.0.0
```

### Deploy

1. Create `ConfigMap` running the command below from the `yaml` folder. Change `Asia/Kolkata` to appropriate timezone value in the `sed` command below. Then, run the following commands to create the `ConfigMap`.

```bash
cd eks-saga-trail/yaml
RDS_DB_ID=eks-saga-db
DB_ENDPOINT=`aws rds describe-db-instances --db-instance-identifier ${RDS_DB_ID} --query 'DBInstances[0].Endpoint.Address' --output text`
sed -e 's#timeZone#Asia/Kolkata#g' \
  -e 's/regionId/'"${REGION_ID}"'/g' \
  -e 's/dbEndpoint/'"${DB_ENDPOINT}"'/g' \
  cfgmap.yaml | kubectl -n eks-saga create -f -
```

3. Deploy the microservice with this command below.

```bash
sed -e 's/regionId/'"${REGION_ID}"'/g' \
  -e 's/accountId/'"${ACCOUNT_ID}"'/g' \
  trail.yaml | kubectl -n eks-saga create -f -
```

## Clean up

To remove objects of the Trail microservice, run the following command.

```bash
kubectl -n eks-saga delete deployment/eks-saga-trail svc/eks-saga-trail ing/eks-saga-trail configmap/eks-saga-trail
```

## Inputs and outputs

The input is the `http` endpoint `/trail/{orderId}` and there are no outputs.
