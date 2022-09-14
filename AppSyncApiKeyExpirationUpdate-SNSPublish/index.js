var AWS = require('aws-sdk');
const sns = new AWS.SNS()
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

exports.handler = async (event) => {
	const response = {
		statusCode: 500,
		body: JSON.stringify("Error"),
	};
	var keyCount = 0;
	var appsync = new AWS.AppSync({ apiVersion: '2017-07-25' });
	var d = new Date();
	d.setDate(d.getDate() + 363);
	d.setHours(0, 0, 0);
	d.setMilliseconds(0);
	const expires = d / 1000 | 0;
	var snsMessage = new Array();

	const graphQlResponse = await appsync.listGraphqlApis().promise();
	if (!graphQlResponse.graphqlApis || graphQlResponse.graphqlApis.length === 0) {
		response.statusCode = 200;
		response.body = JSON.stringify("No APIs found.");
		snsMessage.push('No APIs found.');
		publishToSNS(snsMessage, '[App] [ERROR] App Sync Api Keys expiration Update Failed');
		return response;
	}
	await asyncForEach(graphQlResponse.graphqlApis, async api => {
		const apiId = api.apiId;
		const keysResponse = await appsync.listApiKeys({ apiId }).promise();
		if (!keysResponse.apiKeys || keysResponse.apiKeys.length === 0) {
			return;
		}
		await asyncForEach(keysResponse.apiKeys, async key => {
			var params = {
				apiId,
				id: key.id,
				expires,
			};
			const result = await appsync.updateApiKey(params).promise();
			if (result.apiKey) {
				keyCount++;
				params.expires = d;
				snsMessage.push(params);
			}
		});
	});

	response.statusCode = 200;
	response.body = JSON.stringify(`${keyCount} key${keyCount !== 1 ? "s" : ""} updated.`);
	publishToSNS(snsMessage, '[App] Monthly AppSync Api Keys expiration update.');

	function publishToSNS(snsMessage, snsSubject) {
		if (!snsMessage) {
			return Promise.resolve();
		}
		const body = JSON.stringify(snsMessage);
		return sns.publish({
			Message: body,
			Subject: snsSubject,
			TopicArn: SNS_TOPIC_ARN
		})
			.promise()
			.catch(err => {
				console.log(err);
				return err;
			});
	};

	return response;
};
