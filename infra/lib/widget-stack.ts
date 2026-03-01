import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as path from 'path';

export interface WidgetStackProps extends cdk.StackProps {
    domainName?: string;
    certificateArn?: string;
}

export class WidgetStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: WidgetStackProps) {
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

        // 2. CloudFront Origin Access Control (OAC)
        const oac = new cloudfront.CfnOriginAccessControl(this, 'WidgetOAC', {
            originAccessControlConfig: {
                name: `WidgetOAC-${this.node.addr}`,
                originAccessControlOriginType: 's3',
                signingBehavior: 'always',
                signingProtocol: 'sigv4',
            },
        });

        // Setup Certificate if provided
        let certificate: cdk.aws_certificatemanager.ICertificate | undefined;
        let domainNames: string[] | undefined;

        if (props?.domainName && props?.certificateArn) {
            certificate = cdk.aws_certificatemanager.Certificate.fromCertificateArn(
                this,
                'WidgetCertificate',
                props.certificateArn
            );
            domainNames = [props.domainName];
        }

        // 3. CloudFront Distribution
        const distribution = new cloudfront.Distribution(this, 'WidgetDist', {
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(widgetBucket, {
                    originAccessControlId: oac.attrId
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                compress: true,
                originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
            },
            domainNames: domainNames,
            certificate: certificate,
            defaultRootObject: 'index.html',
            comment: `Widget App - widget.holalucia.cl (${process.env.ENV || 'dev'})`,
        });

        // 4. Add Bucket Policy for OAC
        widgetBucket.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [widgetBucket.arnForObjects('*')],
            principals: [new cdk.aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
            conditions: {
                StringEquals: {
                    'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`
                }
            }
        }));

        // 5. Deploy widget build
        new s3deploy.BucketDeployment(this, 'DeployWidget', {
            sources: [s3deploy.Source.asset(path.join(__dirname, '../../dist'))],
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
