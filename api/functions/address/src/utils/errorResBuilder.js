const { errorRefObj } = require('./errorRefObj');
const { config } = require('../../../../config/config');

module.exports.errorResBuilder = (error) => {
	let errorType = Object.keys(errorRefObj).includes(error) ? error : '';
	let statusCode = (error === 'token_missing' || error === 'invalid_token')
		? 401
		: 400;
	// handle axios timeout error meaning cluster is unresponsive
	if (error.code && error.code === 'ECONNABORTED') {
		errorType = 'server_timeout';
		statusCode = 503;
	}
	// check if it is an axios error from the find call, and escape the throw if so:
	if (error.response && error.response.config && error.response.config.url === `${config.API_BASE_URL}address/${config.API_VERSION}/find`) {
		console.warn('Server returned error:', {
			config: error.response.config,
			data: error.response.data,
		});
		switch (error.response.data.error) {
			case 'Invalid country selected.':
				errorType = 'invalid_country_code';
				break;
			case 'country: Does not match the regex pattern ^[A-Za-z0-9]{2,3}$':
				errorType = 'invalid_country_code';
				break;
			case 'key: Does not match the regex pattern ^[A-Fa-f0-9]{5}-[A-Fa-f0-9]{5}-[A-Fa-f0-9]{5}-[A-Fa-f0-9]{5}$':
				errorType = 'invalid_token';
				statusCode = 401;
				break;
			default:
				errorType = 'internal_server_error';
				statusCode = 500;
				break;
		}
	}
	const body = {
		error: {
			type: errorType,
			message: errorRefObj[errorType] || 'Unknown exception occurred',
		},
	};
	return {
		statusCode,
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	};
};
