const countries = require('./data/countries.json');

const alpha2 = countries.map((item) => item[0]);
const alpha3 = countries.map((item) => item[1]);
const numeric = countries.map((item) => item[2]);

const tokenExists = (token) => !!(token && token.length > 0);
const validateToken = (token) => token.length === 23;
const queryExists = (query) => !!(query && query.length > 0);
const countryExists = (country) => (!!(country && country.length > 0));
const validateCountry = (country) => {
	if (alpha2.includes(country.toString().toUpperCase())) return true;
	if (alpha3.includes(country.toString().toUpperCase())) return true;
	if (numeric.includes(country.toString())) return true;
	return false;
};

module.exports.validateReq = (event) => {
	if (!tokenExists(event.queryStringParameters.token)) return 'token_missing';
	if (!validateToken(event.queryStringParameters.token)) return 'invalid_token';
	const params = event.body ? JSON.parse(event.body) : event.queryStringParameters;
	const { query, country } = params;
	if (!queryExists(query)) return 'query_missing';
	if (!countryExists(country)) return 'country_missing';
	if (!validateCountry(country)) return 'invalid_country_code';
	return 'valid';
};
