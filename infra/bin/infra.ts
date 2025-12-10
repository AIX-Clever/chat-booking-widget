import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WidgetStack } from '../lib/widget-stack';

const app = new cdk.App();
new WidgetStack(app, 'ChatBooking-Widget', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
