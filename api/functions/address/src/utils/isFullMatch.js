const simplify = (str) => str.toLowerCase().replace(/,/g, '');

module.exports.isFullMatch = (query, labels) => {
	const postcode = simplify(labels[0]);
	const address = simplify(labels[1]);
	const simpleQuery = simplify(query);
	if (simpleQuery === (`${address} ${postcode}`)) return true;
	return false;
};
