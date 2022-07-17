exports.getEnv = (context) => {
	let region = 'test-region';
	if (process.env.AWS_REGION) {
		region = process.env.AWS_REGION;
	}
	let stage = 'test';
	if (context && context.functionName) {
		if (context.functionName.includes('PROD')) stage = 'prod';
		else stage = 'staging';
	}
	return {
		region,
		stage,
	};
};
