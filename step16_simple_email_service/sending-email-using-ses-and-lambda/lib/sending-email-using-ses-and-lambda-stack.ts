import * as cdk from '@aws-cdk/core';
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  Effect,
} from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';

export class SendingEmailUsingSesAndLambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Creating a IAM role for lambda to give access of ses send email
    const role = new Role(this, 'LambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    ///Attaching ses access to policy
    const policy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['ses:SendEmail', 'ses:SendRawEmail', 'logs:*'],
      resources: ['*'],
    });
    //granting IAM permissions to role
    role.addToPolicy(policy);

    //  Creating send email lambda handler
    const emailSender = new lambda.Function(this, 'HandleSendEmail', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('fns-lambda'),
      handler: 'lambda.handler',
      role: role,
    });

    // create the API Gateway with one method and path For lambda
    const api = new apigw.RestApi(this, 'SendEmailEndPoint');
    api.root
      .resourceForPath('sendmail')
      .addMethod('POST', new apigw.LambdaIntegration(emailSender));

    // logging api endpoint
    new cdk.CfnOutput(this, 'Send email endpoint', {
      value: `${api.url}sendmail`,
    });
    //
    //
    //
    // import * as cdk from '@aws-cdk/core';

    // import * as apigw from '@aws-cdk/aws-apigateway';

    // export class SendingEmailUsingSesAndLambdaStack extends cdk.Stack {
    //   constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    //     super(scope, id, props);

    //     // The code that defines your stack goes here

    //

    //   }
    // }
    //
    //
    //
  }
}
