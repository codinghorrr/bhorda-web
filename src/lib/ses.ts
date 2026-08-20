import { sha256Hex } from './crypto';

type SendSesEmailOptions = {
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
	from: string;
	to: string;
	subject: string;
	text: string;
};

export async function sendSesEmail(options: SendSesEmailOptions): Promise<void> {
	const host = `email.${options.region}.amazonaws.com`;
	const path = '/v2/email/outbound-emails';
	const url = `https://${host}${path}`;
	const body = JSON.stringify({
		FromEmailAddress: options.from,
		Destination: { ToAddresses: [options.to] },
		Content: {
			Simple: {
				Subject: { Data: options.subject, Charset: 'UTF-8' },
				Body: { Text: { Data: options.text, Charset: 'UTF-8' } },
			},
		},
	});

	const headers = await signAwsRequest({
		method: 'POST',
		url,
		region: options.region,
		service: 'ses',
		accessKeyId: options.accessKeyId,
		secretAccessKey: options.secretAccessKey,
		body,
		contentType: 'application/json',
	});

	const response = await fetch(url, { method: 'POST', headers, body });
	if (!response.ok) {
		const detail = await response.text();
		throw new Error(`SES send failed (${response.status}): ${detail}`);
	}
}

type SignAwsRequestOptions = {
	method: string;
	url: string;
	region: string;
	service: string;
	accessKeyId: string;
	secretAccessKey: string;
	body: string;
	contentType: string;
};

async function signAwsRequest(options: SignAwsRequestOptions): Promise<Headers> {
	const encoder = new TextEncoder();
	const url = new URL(options.url);
	const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
	const dateStamp = amzDate.slice(0, 8);
	const payloadHash = await sha256Hex(options.body);

	const canonicalHeaders =
		`content-type:${options.contentType}\n` +
		`host:${url.host}\n` +
		`x-amz-content-sha256:${payloadHash}\n` +
		`x-amz-date:${amzDate}\n`;
	const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
	const canonicalRequest = [
		options.method,
		url.pathname,
		'',
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	].join('\n');

	const credentialScope = `${dateStamp}/${options.region}/${options.service}/aws4_request`;
	const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256Hex(canonicalRequest)].join('\n');

	const signingKey = await getSignatureKey(options.secretAccessKey, dateStamp, options.region, options.service);
	const signature = await hmacHex(signingKey, stringToSign);

	const authorization = `AWS4-HMAC-SHA256 Credential=${options.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

	return new Headers({
		'content-type': options.contentType,
		host: url.host,
		'x-amz-content-sha256': payloadHash,
		'x-amz-date': amzDate,
		authorization,
	});
}

async function getSignatureKey(
	secret: string,
	dateStamp: string,
	region: string,
	service: string,
): Promise<ArrayBuffer> {
	const encoder = new TextEncoder();
	const kDate = await hmacRaw(encoder.encode(`AWS4${secret}`), dateStamp);
	const kRegion = await hmacRaw(kDate, region);
	const kService = await hmacRaw(kRegion, service);
	return hmacRaw(kService, 'aws4_request');
}

async function hmacRaw(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		key,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);
	return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
	const signature = await hmacRaw(key, data);
	return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
