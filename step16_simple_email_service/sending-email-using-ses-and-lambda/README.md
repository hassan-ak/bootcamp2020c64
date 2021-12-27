# Sending Email Using SES And Lambda

## Reading Material

- [How to send an email with Amazon SES and Serverless - tutorial](https://www.youtube.com/watch?v=4o6GCiUX8Xk)
- [How do I send email using Lambda and Amazon SES?](https://aws.amazon.com/premiumsupport/knowledge-center/lambda-send-email-ses/#:~:text=To%20send%20email%20from%20Lambda,to%20execute%20the%20API%20call.)

## Steps to code

1. Create new directory using `mkdir sending-email-using-ses-and-lambda`
2. Navigate to newly created directory using `cd sending-email-using-ses-and-lambda`
3. Create cdk v1 app using `npx aws-cdk@1.x init app --language typescript`
4. use `npm run watch` to auto transpile the code
5. Install iam in the stack using `npm i @aws-cdk/aws-iam`. Update "./lib/sending-email-using-ses-and-lambda-stack.ts" to define a new role for lambda to give access of ses send email

   ```js
   import { Role, ServicePrincipal } from '@aws-cdk/aws-iam';
   const role = new Role(this, 'LambdaRole', {
     assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
   });
   ```

6. Update "./lib/sending-email-using-ses-and-lambda-stack.ts" to define a new role for lambda to attach ses access to policy and grant IAM permissions to role

   ```js
   import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';
   const policy = new PolicyStatement({
     effect: Effect.ALLOW,
     actions: ['ses:SendEmail', 'ses:SendRawEmail', 'logs:*'],
     resources: ['*'],
   });
   role.addToPolicy(policy);
   ```

7. Install ses in the stack using `npm i @aws-cdk/aws-ses`. Update "./lib/sending-email-using-ses-and-lambda-stack.ts" to define a new rule set.

   ```js
   import * as ses from '@aws-cdk/aws-ses';
   const ruleSet = new ses.ReceiptRuleSet(this, 'RuleSet', {
     receiptRuleSetName: 'saving-email-rule-set',
   });
   ```

8. Install lambda in the stack using `npm i @aws-cdk/aws-lambda`. Update "./lib/sending-email-using-ses-and-lambda-stack.ts" to define a send email lambda function

   ```js
   import * as lambda from '@aws-cdk/aws-lambda';
   const emailSender = new lambda.Function(this, 'HandleSendEmail', {
     runtime: lambda.Runtime.NODEJS_14_X,
     code: lambda.Code.fromAsset('fns-lambda'),
     handler: 'lambda.handler',
     role: role,
   });
   ```

9. Install apigateway in the stack using `npm i @aws-cdk/aws-apigateway`. Update "./lib/sending-email-using-ses-and-lambda-stack.ts" to define api gateway and add resource and method

   ```js
   import * as apigw from '@aws-cdk/aws-apigateway';
   const api = new apigw.RestApi(this, 'SendEmailEndPoint');
   api.root
     .resourceForPath('sendmail')
     .addMethod('POST', new apigw.LambdaIntegration(emailSender));
   ```

10. Update "./lib/sending-email-using-ses-and-lambda-stack.ts" to get URL on console

    ```js
    new cdk.CfnOutput(this, 'Send email endpoint', {
      value: `${api.url}sendmail`,
    });
    ```

11. Create "./fns-lambda/lambda.ts" to define handler code

    ```js
    import { SES } from 'aws-sdk';
    const ses = new SES();
    interface EmailParam {
      to?: string;
      from?: string;
      subject?: string;
      text?: string;
    }
    export async function handler(event: any) {
      console.log('REQUEST ==>>', event.body);
      const { to, from, subject, text } = JSON.parse(
        event.body || '{}'
      ) as EmailParam;
      if (!to || !from || !subject || !text) {
        return Responses._400({
          message: 'to, from, subject and text are all required in the body',
        });
      }
      const params = {
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Body: {
            Text: { Data: text },
          },
          Subject: { Data: subject },
        },
        Source: from,
      };
      try {
        await ses.sendEmail(params).promise();
        return Responses._200({ message: 'The email has been sent' });
      } catch (error) {
        console.log('error sending email ', error);
        return Responses._400({ message: 'The email failed to send' });
      }
    }
    const Responses = {
      _200(data: Object) {
        return {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Origin': '*',
          },
          statusCode: 200,
          body: JSON.stringify(data),
        };
      },
      _400(data: Object) {
        return {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Origin': '*',
          },
          statusCode: 400,
          body: JSON.stringify(data),
        };
      },
    };
    ```

12. Deploy the app using `npm run cdk deploy`
13. Now go to your SES console. Click on the Rule Sets tab. You will see by default your default-rule-set is already activated, so you have to disable it first, than activate your new rule set which you have created with CDK deployment.
14. Destroy the app using `npm run cdk destroy` before that make sure that you have disabled your rule set otherwire you will get an error.
