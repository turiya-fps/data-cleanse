const axios = require('axios');
const Sentry = require('@sentry/serverless');
const { config } = require('../../../config/config');
const { validateReq } = require('./utils/validateReq');
const { errorResBuilder } = require('./utils/errorResBuilder');
const { isFullMatch } = require('./utils/isFullMatch');
const { getEnv } = require('../../../common/getEnv');
const countries = require('./utils/data/countries.json');

exports.addressHandler = async (event, context) => {
	Sentry.AWSLambda.init({
		dsn: 'https://06f3b4f441b94252976b01a1885de909@o51424.ingest.sentry.io/6487579',
		environment: event.requestContext.stage === 'dev' ? 'development' : 'production',
		tracesSampleRate: 1.0,
	});

	try {
		// handle ALB healthcheck pings
		if (event.headers !== undefined && ((event.headers['user-agent'] || event.headers['User-Agent']) === 'ELB-HealthChecker/2.0')) {
			return {
				statusCode: 200,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					status: 'healthy',
				}),
			};
		}
		const usingNetwork = event.requestContext.stage === 'dev' ? 'public' : 'private';
		const apiUrl = `${config.API_BASE_URL[usingNetwork]}/address/${config.API_VERSION}/find`;

		// handle context checks (if the query param ?getEnv=true is passed)
		const { region, stage } = getEnv(context);
		const isGetEnv = Object.prototype.hasOwnProperty.call(event.queryStringParameters, 'getEnv')
			? event.queryStringParameters.getEnv
			: false;
		if (isGetEnv) {
			return {
				statusCode: 200,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					region,
					stage,
					apiUrl,
				}),
			};
		}

		// validate
		const validityStatus = validateReq(event);
		if (validityStatus !== 'valid') return errorResBuilder(validityStatus);

		// find
		const ipType = event.requestContext.stage === 'dev' ? 'public' : 'private';
		const key = event.queryStringParameters.token;
		const params = event.body ? JSON.parse(event.body) : event.queryStringParameters;
		const { query, country } = params;
		const url = `${config.API_BASE_URL[ipType]}/address/${config.API_VERSION}/find`;
		const fetchRequest = {
			key,
			query: decodeURIComponent(query),
			country,
			extra: {
				best_match_only: true,
			},
		};
		const timeout = {
			timeout: 7500,
		};
		const headers = {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
		};

		if (event.httpMethod === 'OPTIONS') {
			return {
				statusCode: 200,
				headers,
				body: '',
			};
		}

		return axios.post(url, fetchRequest, timeout, headers)
			.then(async (res) => {
				if (!res.data) throw new Error('no_data_returned');
				if (!res.data.results || !res.data.results.length) {
					return ({
						statusCode: 200,
						headers,
						body: JSON.stringify({
							status: 'no_match',
						}),
					});
				}
				const { id, labels } = res.data.results[0];
				const url2 = `${config.API_BASE_URL[ipType]}/address/${config.API_VERSION}/retrieve`;
				// call the `retrieve` API method for billing:
				const { data: { result: elastic } } = await axios.get(url2, {
					data: {
						key,
						country,
						id,
						integration: 'f23xhajuzz',
					},
				});
				const countryISOCodes = countries.find((item) => item.includes(country.toUpperCase()));
				const result = {
					address: [labels[1], labels[0], elastic.country_name].filter((val) => val).join(', '),
					fields: {
						alternative_town: elastic.alternative_locality,
						alternative_region: elastic.alternative_province,
						building: elastic.building_name,
						building_lev_1_ind: elastic.unit_name,
						country_name: countryISOCodes[3],
						country_code: countryISOCodes[0],
						del_serv_id: elastic.post_office_box_number,
						district_lev_1_pos_1: elastic.dependent_locality,
						district_lev_2_pos_1: elastic.double_dependent_locality,
						extension_designation: elastic.sub_building_name,
						floor: elastic.level_name,
						org_name: elastic.company_name,
						org_unit: elastic.department_name,
						postcode: elastic.postal_code,
						prem_id: elastic.building_number,
						prim_thoro_name: elastic.street_name,
						region: elastic.province,
						region_code: elastic.province_code,
						region_name: elastic.province_name,
						sec_thoro_name: elastic.dependent_street_name,
						succ_prim_thoro_type: elastic.street_suffix,
						succ_sec_thoro_type: elastic.dependent_street_suffix,
						town: elastic.locality,
						iso_3166_1: {
							alpha_2: countryISOCodes[0],
							alpha_3: countryISOCodes[1],
							numeric: countryISOCodes[2],
						},
					},
					optional_fields: {
						...(elastic.country_name === 'United Kingdom' && {
							...(elastic.post_office_reference_1 !== '' && { udprn: elastic.post_office_reference_1 }),
							...(elastic.post_office_reference_2 !== '' && { dps: elastic.post_office_reference_2 }),
							...(elastic.post_office_reference_3 !== '' && { umrrn: elastic.post_office_reference_3 }),
							...(elastic.post_office_reference_4 !== '' && { uprn: elastic.post_office_reference_4 }),
						}),
					},
				};
				if (isFullMatch(query, labels) === true) {
					return {
						statusCode: 200,
						headers,
						body: JSON.stringify({
							status: 'full_match',
							...result,
						}),
					};
				}
				return {
					statusCode: 200,
					headers,
					body: JSON.stringify({
						status: 'partial_match',
						...result,
					}),
				};
			}).catch((err) => errorResBuilder(err));
	} catch (err) {
		Sentry.captureException(err);
		return {
			statusCode: 500,
			body: JSON.stringify({
				error: err,
			}),
		};
	}
};
