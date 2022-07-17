const chai = require('chai');
const app = require('../functions/address/src/app');

const { expect } = chai;
const healthCheckEvent = require('../events/address-event-health-check.json');
const partialMatchEvent = require('../events/address-event-partial_match.json');
const noMatchEvent = require('../events/address-event-no_match.json');
const fullMatchEvent = require('../events/address-event-full_match.json');
const queryParameterEvent = require('../events/address-event-query-parameter.json');
const invalidTokenEvent = require('../events/address-event-invalid_token.json');
const missingTokenEvent = require('../events/address-event-token_missing.json');
const missingQueryEvent = require('../events/address-event-missing_query.json');
const missingCountryEvent = require('../events/address-event-missing_country.json');
const invalidCountryEvent = require('../events/address-event-invalid_country.json');

let context;

describe('Tests address handler', () => {
	it('serves a healthcheck response', async () => {
		const result = await app.addressHandler(healthCheckEvent, context);
		expect(result.statusCode).to.equal(200);
		const body = JSON.parse(result.body);
		expect(body.status).to.equal('healthy');
	});
	it('serves a correct partial_match response', async () => {
		const result = await app.addressHandler(partialMatchEvent, context);
		const response = JSON.parse(result.body);
		expect(response).to.be.an('object');
		expect(response.status).to.be.a('string');
		expect(response.status).to.equal('partial_match');
		expect(response.address).to.be.a('string');
		expect(response.fields).to.be.an('object');
		expect(response.optional_fields).to.be.an('object');
		expect(response.fields).to.haveOwnProperty('postcode');
		expect(response.fields).to.haveOwnProperty('country_name');
	});
	it('serves a correct no_match response', async () => {
		const result = await app.addressHandler(noMatchEvent, context);
		const response = JSON.parse(result.body);
		expect(response).to.be.an('object');
		expect(response.status).to.be.a('string');
		expect(response.status).to.equal('no_match');
	});
	it('serves a correct full_match response', async () => {
		const result = await app.addressHandler(fullMatchEvent, context);
		const response = JSON.parse(result.body);
		expect(response).to.be.an('object');
		expect(response.status).to.be.a('string');
		expect(response.status).to.equal('full_match');
		expect(response.address).to.be.a('string');
		expect(response.fields).to.be.an('object');
		expect(response.optional_fields).to.be.an('object');
		expect(response.fields).to.haveOwnProperty('postcode');
		expect(response.fields).to.haveOwnProperty('country_name');
	});
	it('serves a correct full_match response using query parameters', async () => {
		const result = await app.addressHandler(queryParameterEvent, context);
		const response = JSON.parse(result.body);
		expect(response).to.be.an('object');
		expect(response.status).to.be.a('string');
		expect(response.status).to.equal('full_match');
		expect(response.address).to.be.a('string');
		expect(response.fields).to.be.an('object');
		expect(response.optional_fields).to.be.an('object');
		expect(response.fields).to.haveOwnProperty('postcode');
		expect(response.fields).to.haveOwnProperty('country_name');
	});
	it('handles missing token error', async () => {
		const result = await app.addressHandler(missingTokenEvent, context);
		expect(result.statusCode).to.equal(401);
		const response = JSON.parse(result.body);
		expect(response).to.be.an('object');
		expect(response.error).to.be.an('object');
		expect(response.error.type).to.be.a('string');
		expect(response.error.type).to.equal('token_missing');
		expect(response.error.message).to.be.a('string');
		expect(response.error.message).to.equal('An access token is required');
	});
	it('handles invalid token error', async () => {
		const result = await app.addressHandler(invalidTokenEvent, context);
		expect(result.statusCode).to.equal(401);
		const response = JSON.parse(result.body);
		expect(response).to.be.an('object');
		expect(response.error).to.be.an('object');
		expect(response.error.type).to.be.a('string');
		expect(response.error.type).to.equal('invalid_token');
		expect(response.error.message).to.be.a('string');
		expect(response.error.message).to.equal('Invalid access token');
	});
	it('handles missing query error', async () => {
		const result = await app.addressHandler(missingQueryEvent, context);
		expect(result.statusCode).to.equal(400);
		const response = JSON.parse(result.body);
		expect(response).to.be.an('object');
		expect(response.error).to.be.an('object');
		expect(response.error.type).to.be.a('string');
		expect(response.error.type).to.equal('query_missing');
		expect(response.error.message).to.be.a('string');
		expect(response.error.message).to.equal('The property \'query\' is required');
	});
	it('handles missing country error', async () => {
		const result = await app.addressHandler(missingCountryEvent, context);
		expect(result.statusCode).to.equal(400);
		const response = JSON.parse(result.body);
		expect(response).to.be.an('object');
		expect(response.error).to.be.an('object');
		expect(response.error.type).to.be.a('string');
		expect(response.error.type).to.equal('country_missing');
		expect(response.error.message).to.be.a('string');
		expect(response.error.message).to.equal('The property \'country\' is required');
	});
	it('handles invalid country code error', async () => {
		const result = await app.addressHandler(invalidCountryEvent, context);
		expect(result.statusCode).to.equal(400);
		const response = JSON.parse(result.body);
		expect(response).to.be.an('object');
		expect(response.error).to.be.an('object');
		expect(response.error.type).to.be.a('string');
		expect(response.error.type).to.equal('invalid_country_code');
		expect(response.error.message).to.be.a('string');
		expect(response.error.message).to.equal('Country code must be of ISO 3166-1 type');
	});
});
