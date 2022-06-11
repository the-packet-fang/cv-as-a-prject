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