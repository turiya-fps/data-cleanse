const { default: axios } = require('axios');
const fs = require('fs');

const n = process.argv[2] || 50;
const stage = process.argv[3] || 'staging';
const showEnv = process.argv[4] || 'false';
const subdomain = stage === 'prod' ? 'api' : 'staging';

const fetch = async (number) => {
	let params = {
		token: '52a07-524ed-8a4d4-067b0',
	};
	const data = {
		query: 'buckingham palace',
		country: 'gbr',
	};
	const fileName = `${Date.now()}_${number}`;
	fs.writeFile(`./test/live-test/output/${fileName}`, `Requested ${number} results:`, (err) => {
		if (err) console.error(err);
	});
	let fetchUrl = `https://${subdomain}.fetchify.com/address/cleanse`;
	const stream = fs.createWriteStream(`./test/live-test/output/${fileName}`);
	if (showEnv === 'true') {
		fetchUrl = `https://${subdomain}.fetchify.com/address/cleanse?getEnv=true`;
		params = { ...params, getEnv: true };
	} else {
		console.log(`Fetching ${number} addresses on ${stage} system...`);
		console.log(fetchUrl);
	}
	if (showEnv === 'true') {
		const getEnvSync = (r) => {
			if (r < number) {
				axios.get(fetchUrl, { params, data })
					.then((res) => {
						if (res.data) stream.write(`${r + 1}: ${JSON.stringify(res.data)}\n`);
						else stream.write(`${r + 1}: ${JSON.stringify(res)}\n`);
						if (r === number - 2) return console.log('Done!');
						return null;
					})
					.catch((err) => {
						if (!err.response.status) return stream.write(`${JSON.stringify(err.response, err)}\n`);
						return stream.write(`${r + 1}: ${JSON.stringify(err.response.status, err)}\n`);
					});
				getEnvSync(r + 1);
			}
		};
		getEnvSync(0);
	} else {
		for (let i = 0; i <= (number - 1); i++) {
			axios.get(fetchUrl, { params, data })
				.then((res) => {
					if (res.data) stream.write(`${i + 1}: ${JSON.stringify(res.data)}\n`);
					else stream.write(`${i + 1}: ${JSON.stringify(res)}\n`);
					if (i === number - 2) return console.log('Done!');
					return null;
				})
				.catch((err) => {
					if (!err.response.status) return stream.write(`${JSON.stringify(err.response, err)}\n`);
					return stream.write(`${i + 1}: ${JSON.stringify(err.response.status, err)}\n`);
				});
		}
	}
};
fetch(n).then().catch((err) => console.error(err));
