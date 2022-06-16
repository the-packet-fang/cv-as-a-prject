*The code may not reflect the current release of the website.*

# A serverless resume website deployed on AWS

This repository is hosting my ongoing project to create a website for my resume on AWS.

## Overview & tasks

The resume needs to be written in HTML/CSS and deployed on S3. Cloudfront will be used as a CDN to cache and deliver data, in addition to providing an HTTPS endpoint. A new subdomain is needed to create a hosted zone in Route53 resolving to Cloudfront, with ACM public certificate. Javascript will be used on the client-side to log the visitors' number and to check the browser used, the public IP address and some additional data then sending it to API Gateway, which will trigger a lambda function to write the collected data to a dynamoDB table. The whole infrastructure needs to be written as IaC, and finally, this needs to be deployed in a CI/CD style.

### Todo list:

* [x] Create a GitHub repository
* [x] Create the website (HTML, CSS...)
* [x] Upload it to the S3 bucket and configure CloudFront distribution
* [x] Add a domain name resolving to the CloudFront distribution
    * [x] Add a subdomain on my registrar and create a hosted zone on Route 53
    * [x]  Add TLS certificate for the HTTPS content with the custom domain
* [x] Add Javascript to get the client browser, the public IP address, and some location data.
* [x] Create a dynamoDB table and use lambda functions to get/put data to the table.
* [x] Deploy HTTP API gateway to get requests from the client and trigger the lambda functions accordingly.
* [ ] Use terraform to write the Infrastructure as Code.
* [ ] Use Github Actions for CI/CD pipeline


## My journey

### Initiating the GitHub repository
To start with Github, I decide to refresh my knowledge with [Github skills](https://skills.github.com/). Then I initiated a local repository with a new HTML file
```
~/ $ git init cv-as-a-project
~/ $ cd  cv-as-a-project/ && code index.html
~/ $ git add cv.html
~/ $ git commit -m "init repo"
```
Trying to push it to Github failed with the error "Support for password authentication removed”, and a link describing the switch to `access tokens` instead of `username & password` with the steps required. A new token needs to be created and using the `gh` command to load it locally, then pushing the change to the central repository is working.

### Getting to the website
I headed to [w3schools](https://www.w3schools.com/) and started drafting the resume I'm trying to build. After getting a basic grasp of the syntax, I chose a template and build a mockup with the certification I hold, work experience, and additional information.

### Introducing AWS services
Here I decided to get into AWS and start getting a real form of how the project will be. At this point, I already checked how the services work from the console side, so to get some experience with the CLI, I installed `aws-cli`  to do the following tasks.

Create a new bucket:
```
~/ $ aws mb s3://mybucketname
```
Upload the file:
```
~/ $ aws s3 cp index.html s3://mybucketname
```
From the AWS SAA program, I know that no access is needed to this bucket apart from Cloudfront, so public access can be disabled to rely only on origin access identity (OAI).
```
~/ $ aws s3api get-bucket-policy --bucket cv-project

An error occurred (NoSuchBucketPolicy) when calling the GetBucketPolicy operation: The bucket policy does not exist

~/ $ aws s3api get-public-access-block  --bucket cv-project

An error occurred (NoSuchPublicAccessBlockConfiguration) when calling the GetPublicAccessBlock operation: The public access block configuration was not found
```
This means that neither the policy nor the public access block are used at this point.

So to block public access to the S3 bucket I used this command: 
```
~/ $ aws s3api put-public-access-block \
    --bucket mybucketname \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```
Cloudfront was chosen to benefit primarily from the HTTPS capability while using our certificate and domain name. I started by referring to [the documention](https://docs.aws.amazon.com/cli/latest/reference/cloudfront/create-distribution.html), where I found an example template with all the options to create a new distribution. This template needs to be loaded into a JSON file which I named `dist-config.json`. Before creating the distribution, I could note that the OAI policy won't be generated similar to doing it via the console. So the following command is needed first:
```
~/ $ aws cloudfront create-cloud-front-origin-access-identity \
    --cloud-front-origin-access-identity-config \
        CallerReference="mybucketname-oai",Comment="cv OAI"
``` 
Then permissions need to be allocated to this OAI by updating the bucket policy to include the READ right to its objects. The following IAM policy can be used to accomplish this:
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

>accoding to the [least privilege](https://aws.amazon.com/blogs/security/techniques-for-writing-least-privilege-iam-policies/) principal, only `s3:GetObject"` is used since no other action will be needed.

Update the bucket policy with this command:
```
~/ $ aws aws s3api put-bucket-policy --bucket cv-project --policy oai-policy.json
```

Finally, getting back to the distribution config file, I added `"S3OriginConfig": "OriginAccessIdentity"` in addition to other value like  `"ViewerProtocolPolicy":"redirect-to-https"`, `"PriceClass":"PriceClass_200"`, and  `"DefaultRootObject":"cv.html"`

Then executed this command to create the distribution:
```
~/ $ aws cloudfront create-distribution \
    --distribution-config file://dist-config.json
```

The last step is to check the status using `AWS CloudFront list-distributions ` if changed from *InProgress* to *Deployed*, then we can get the CloudFront URL and make our first request.

### Cloudflare and route 53
I had `amethystfang.com` registered with Cloudflare, and for this project, I used a subdomain transferred to Route 53.

First thing, a new hosted zone on Route53 is created with the subdomain `cloud.amethystfang.com.` allocated for this project.

After creating the hosted zone, four NS records and one SOA record are created by default. The four NS records are used to create four new NS records under Cloudflare's DNS.

Then a new A record is created on Route 53 with the new subdomain: `cv.cloud.amethystfang.com.` 

.
.
.


Test the record resolution with:
```
~/  dig cv.cloud.amethystfang.com

; <<>> DiG 9.18.0 <<>> cv.cloud.amethystfang.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 33645
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 1280
; COOKIE: c791a519e4a15f0be030bb086265eb44a111572c4245e4dc (good)
;; QUESTION SECTION:
;cv.cloud.amethystfang.com.   IN      A

;; ANSWER SECTION:
cv.cloud.amethystfang.com. 300 IN     A       1.1.1.1

;; Query time: 183 msec
;; SERVER: 192.168.245.124#53(192.168.245.124) (UDP)
;; WHEN: Mon Apr 25 00:28:52 +00 2022
;; MSG SIZE  rcvd: 100
```
### Incorporating public certificates: Cloudflare & ACM
Initially, I started this section with a clear idea that the CA is on Cloudflare, and I only needed to get it, then upload it to ACM to work with the subdomain used on Route 53. After a small search, I found this [link](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca#1-create-an-origin-ca-certificate) with the necessary steps and the origin CA from Cloudflare, but even though I followed the steps from [the AWS documentation](https://aws.amazon.com/premiumsupport/knowledge-center/acm-import-troubleshooting/), I kept getting:

```
The certificate that is attached to your distribution was not issued by a trusted Certificate Authority.
For more details, see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html#alternate-domain-names-requirements
```
I was sure that at this point, everything was configured accordingly (since a handful of errors were fixed before getting to this one). So after some research, especially one [r/aws](https://www.reddit.com/r/aws/) I could confirm that AWS isn't trusting Cloudflare's CA as it is not on [The Mozilla CA Certificate Program's list](https://wiki.mozilla.org/CA/Included_Certificates).

At this point, I switch to ACM, by generating a certificate for the subdomain used on AWS. The steps are described in this [how-to guide](https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html), where the ownership needs to be verified as explained [here](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html), and preferably using [DNS validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html).

### Javascript
With no previous knowledge of JS, I went back to [w3schools](https://www.w3schools.com/) to accumulate the basics before making the next step, and this was the steepest learning curve on this project until now. I also decided to raise the bar of this challenge and to collect the browser used by clients, and the public IP address in addition to related information about it. 

After understanding enough about the needed task, I started by referring to some StackOverflow posts for guidance. In the end, with many trials and errors, I could have a properly working script to do the necessary tasks.

### The Backend: DynamoDB & Lambda functions
In this section, I started by creating the DB table, and since this is a NO-SQL DB, working with the data was easier than expected.

 For the Lambda function, I could write a small program to send data to the DB using Python. The function was assigned with proper IAM roles/policies to access DyanmoDB and used the boto3 library to connect and write to the DB according to [This documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/dynamodb.html).

### Bridging the end-to-end data flow using API Gateway
At this point, The frontend script can collect the required data and send it to an endpoint, and the lambda function is successfully reading and writing to the DB. The only element needed to interconnect those two is HTTP API Gateway. 

I created two routes; the first one accepts GET requests and triggers the first function to query the number of entries in the table which will work as a visitor's counter. The second route for POST requests with JSON payload is handed to a second function to serialize the data and write it to the DB.

I used Postman for testing and encountered some CORS issues. At this point, I disabled the caching functionality to easily test the changes. And with enough research, especially after finding [this useful blog post](https://dev.to/aws-builders/your-complete-api-gateway-and-cors-guide-11jb), I did the necessary tuning and deploy all changes to production.

