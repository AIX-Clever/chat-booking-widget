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

        // ==========================================
        // CONFIGURACION DE IPs DEL EQUIPO
        // ==========================================
        let teamAllowedIPs = [
            "127.0.0.1", // IP inaccesible por defecto (bloquea todo si no hay variable)
        ];
        
        if (process.env.ALLOWED_IPS) {
            teamAllowedIPs = process.env.ALLOWED_IPS.split(',').map(ip => ip.trim()).filter(Boolean);
        }

        const envName = process.env.ENV || 'dev';
        const isRestrictedEnv = envName === 'dev' || envName === 'qa';
        const allowedIPsForEnv = isRestrictedEnv ? teamAllowedIPs : [];
        const allowedIPsJson = JSON.stringify(allowedIPsForEnv);

        const routerFunction = new cloudfront.Function(this, 'WidgetRouterFunction', {
            code: cloudfront.FunctionCode.fromInline(`
                function handler(event) {
                    var request = event.request;
                    var clientIP = event.viewer.ip;

                    // IPs permitidas (vacio = acceso libre)
                    var allowedIPs = ${allowedIPsJson};

                    if (allowedIPs.length > 0 && allowedIPs.indexOf(clientIP) === -1) {
                        return {
                            statusCode: 403,
                            statusDescription: 'Forbidden',
                            headers: {
                                'content-type': { value: 'text/html; charset=UTF-8' }
                            },
                            body: '<!DOCTYPE html><html><head><title>Acceso Restringido</title></head><body style="font-family: sans-serif; text-align: center; padding-top: 50px;"><h1>🚧 Sitio en Construccion 🚧</h1><p>El acceso esta restringido temporalmente.</p></body></html>'
                        };
                    }
                    
                    return request;
                }
            `),
            comment: 'Restricts IP access for lower environments',
        });

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
                functionAssociations: [
                    {
                        function: routerFunction,
                        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                    }
                ],
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
            sources: [
                s3deploy.Source.asset(path.join(__dirname, '../../dist')),
                s3deploy.Source.asset(path.join(__dirname, '../../public'))
            ],
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
