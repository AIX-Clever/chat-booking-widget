import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as path from 'path';

export class WidgetStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // 1. S3 Bucket for hosting widget script
        const widgetBucket = new s3.Bucket(this, 'WidgetBucket', {
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.GET],
                    allowedOrigins: ['*'], // Widget needs to be accessible from any client site
                    allowedHeaders: ['*'],
                },
            ],
        });

        // 2. CloudFront Function (IP Restriction)
        const ipFunction = new cloudfront.Function(this, 'IpRestriction', {
            code: cloudfront.FunctionCode.fromInline(`
                function handler(event) {
                    var request = event.request;
                    var clientIP = event.viewer.ip;
                    var allowedIPs = ['200.90.242.144'];

                    if (allowedIPs.indexOf(clientIP) === -1) {
                        return {
                            statusCode: 403,
                            statusDescription: 'Forbidden',
                            body: {
                                "encoding": "text",
                                "data": "Access Denied"
                            }
                        };
                    }
                    return request;
                }
            `),
        });

        // 3. CloudFront Distribution
        const distribution = new cloudfront.Distribution(this, 'WidgetDist', {
            defaultBehavior: {
                origin: new origins.S3Origin(widgetBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                compress: true,
                originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                functionAssociations: [{
                    function: ipFunction,
                    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                }],
            },
        });

        // 3. Deploy widget build
        new s3deploy.BucketDeployment(this, 'DeployWidget', {
            sources: [s3deploy.Source.asset(path.join(__dirname, '../../dist'))], // Assumes 'dist' folder exists
            destinationBucket: widgetBucket,
            distribution: distribution,
            distributionPaths: ['/*'],
        });

        // Outputs
        new cdk.CfnOutput(this, 'WidgetUrl', {
            value: `https://${distribution.distributionDomainName}/chat-widget.js`,
        });
    }
}
