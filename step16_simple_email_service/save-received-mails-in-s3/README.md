# Saving Received Emails In Amazon S3 On Verified Domain

## Notes

- Currently AWS is supporting email receiving support in three regions us-east-1, us-west-2 and eu-west-1.
- We should have our own domain.
- Domain should be verified on Amazon SES.
- We should have atleast one rule define to receive email on given verified email addresses.

## Reading Material

- [how to receive emails on Amazon email server](https://www.youtube.com/watch?v=2fWj3EKYalg&t=735s&ab_channel=CloudAcademy)
- [Amazon Simple Email Service endpoints and quotas](https://docs.aws.amazon.com/general/latest/gr/ses.html)
- [How to verify your domain on AWS SES](https://www.youtube.com/watch?v=j8izLCTBIwg&ab_channel=AWSWithAtiq)
- [Create a rule set to receive emails](https://www.youtube.com/watch?v=nxXIpPZzMd0&ab_channel=AmazonWebServices)

## Steps to code

1. Create new directory using `mkdir save-received-mails-in-s3`
2. Navigate to newly created directory using `cd save-received-mails-in-s3`
3. Create cdk v1 app using `npx aws-cdk@1.x init app --language typescript`
4. use `npm run watch` to auto transpile the code
5. Install s3 in the stack using `npm i @aws-cdk/aws-s3`. Update "./lib/save-received-mails-in-s3-stack.ts" to define a s3 bucket

   ```js
   import * as s3 from '@aws-cdk/aws-s3';
   const bucket = new s3.Bucket(this, 'Bucket');
   ```

6. Install ses in the stack using `npm i @aws-cdk/aws-ses`. Update "./lib/save-received-mails-in-s3-stack.ts" to define a new rule set.

   ```js
   import * as ses from '@aws-cdk/aws-ses';
   const ruleSet = new ses.ReceiptRuleSet(this, 'RuleSet', {
     receiptRuleSetName: 'saving-email-rule-set',
   });
   ```

7. Update "./lib/save-received-mails-in-s3-stack.ts" to create instance for taking email input while deployment

   ```js
   const emailAddress = new cdk.CfnParameter(this, 'emailParam', {
     type: 'String',
     description: 'Write your recipient email',
   });
   ```

8. Install ses actions in the stack using `npm i @aws-cdk/aws-ses-actions`. Update "./lib/save-received-mails-in-s3-stack.ts" to define a rule whihc goes in the rule set

   ```js
   import * as actions from '@aws-cdk/aws-ses-actions';
   ruleSet.addRule('INVOKE_LAMBDA_RULE', {
     recipients: [emailAddress.valueAsString],
     actions: [
       new actions.S3({
         bucket,
         objectKeyPrefix: 'emails/',
       }),
     ],
     scanEnabled: true,
   });
   ```

9. Deploy the app using `npm run cdk deploy --parameters emailParam=info@example.com`
10. Now go to your SES console. Click on the Rule Sets tab. You will see by default your default-rule-set is already activated, so you have to disable it first, than activate your new rule set which you have created with CDK deployment.
11. Destroy the app using `npm run cdk destroy` before that make sure that you have disabled your rule set otherwire you will get an error.
