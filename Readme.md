*The code may not reflect the current release of the website.*

# A serverless resume website deployed on AWS

This repository is hosting my on-going project to create a website for my resume on AWS.

## Overview & tasks

The resume needs to be writen in HTML/CSS and deployed on S3. Cloudfront will be used as a CDN to cache and deliver data, in adition to providing an HTTPS endpoint. A new subdomain is needed to create a hosted zone in Route53 resolving to Cloudfront, with ACM public certificate. Javascript will be used on the client side to log the visitors number and to check the browser used, the public IP address and some additional data then sending it to API Gateway, which will trigger a labmda function to write the collected data to a dynamoDB table. The whole infrastructure needs to be writen as IaC, and finally this needs to be deployed in a CI/CD style.

### Todo list:

* [x] Create a GitHub repository
* [x] Create the website (HTML, CSS...)
* [x] Upload it to S3 bucket and configure CloudFront distribution
* [x] Add a domain name resolving to the CloudFront distribution
    * [x] Add a subdomain on my registar and create a hosted zone on Route 53
    * [x]  Add a CA for the HTTPS content
* [x] Add Javascript to get the client browser, the public IP address and some location data.
* [x] Create a dynamoDB table and use lambda functions to get/put data to the table.
* [x] Deploy HTTP API gateway to get requests from the client's front-end and trigger the lambda functions.
* [ ] Use terraform to write the Infrastructure as Code.
* [ ] Use Github Actions for CI/CD pipiline


## My journey

### Initiating the GitHub repository
To start with Github, I decide to refresh my knowlegde with [Github skills](https://skills.github.com/). Then I initaled a local repositoy with a base html file
```
git init cv-as-a-project
cd  cv-as-a-project/ && code index.html
git add cv.html
git commit -m "init repo"
```
Trying to push it to github failed with error "Support for password authentication removed”, and a link for the steps to enable access tokens instead of username/password. The steps are self-explanatory where a new token needs to be created, and using `gh` command to load it locally, then we could push the change to the central repository.


### Getting to the website
I never found time to get some basic knowlegde about HTML and CSS, but this time has come. I headed to [w3schools](https://www.w3schools.com/) and started drafting the resume I'm trying to build. After getting a basic grasp of the syntax, I chose a template and build a mockup.

### Indroducing AWS services
Here I decided to get into AWS and start getting a real form of how project will be. At this point, I already checked how the services work from the console side, so to get some experince with the CLI, I installed `aws-cli`  to do the following tasks.

Create a new bucket:
```
aws mb s3://mybucketname
```
Upload the file:
```
aws s3 cp index.html s3://mybucketname
```
From the AWS SAA program, I know that no access is needed to this bucket apart form Cloudfront, so we can disable public access and use origin access identity (OAI).
```
~/ $ aws s3api get-bucket-policy --bucket cv-project

An error occurred (NoSuchBucketPolicy) when calling the GetBucketPolicy operation: The bucket policy does not exist

~/ $aws s3api get-public-access-block  --bucket cv-project

An error occurred (NoSuchPublicAccessBlockConfiguration) when calling the GetPublicAccessBlock operation: The public access block configuration was not found
```
This means that nor the policy neither the public access block are used yet.

So to block public access to the S3 bucket we can use this command: 
```
aws s3api put-public-access-block \
    --bucket mybucketname \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```
For the Cloudfront part, We'll be using this service  to benefit primarly from the HTTPS capability, while using our own certificate and domain name. I started by referring to the [the documention](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/create-distribution.html), where I found a example template with all the options to create a new distribution. This template need to be loaded into a JSON file, which will be called `dist-config.json`. Before creating the distribution, I could note that the OAI policy won't be generated similarlly to the console part. So the following command is needed first:
```
~/ $ aws cloudfront create-cloud-front-origin-access-identity \
    --cloud-front-origin-access-identity-config \
        CallerReference="mybucketname-oai",Comment="cv OAI"
``` 
Then permissions need to be allocated to this OAI by updating the bucket policy to include the READ right to its objects. The following IAM policy can be used to acomplish this:
```
{
    "Version": "2012-10-17",
    "Id": "PolicyForCloudFrontPrivateContent",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity XXXXXXXXXXX"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::mybucketname/*"
        }
    ]
}
```

>accoding to the [least privilege](https://aws.amazon.com/blogs/security/techniques-for-writing-least-privilege-iam-policies/) principal, only `s3:GetObject"` is used since we won't need any other action.

To update the bucket policy we'll use this command:
```
~/ $ aws aws s3api put-bucket-policy --bucket cv-project --policy oai-policy.json
```

Finally, getting back to the distribution config file, we can add `"S3OriginConfig": "OriginAccessIdentity"` in addition to other value like  `"ViewerProtocolPolicy":"redirect-to-https"`, `"PriceClass":"PriceClass_200"`, and  `"DefaultRootObject":"index.html"`

Then we can execute the command to create the distribution:
```
~/ $ aws cloudfront create-distribution \
    --distribution-config file://dist-config.json
```

The last step is to check using `aws cloudfront list-distributions ` for the status to change form *InProgress* to *Deployed*, then we can get the cloudfront url and make a our first request.
